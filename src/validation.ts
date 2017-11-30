import "reflect-metadata";

import { Validator, Validation } from "./validators";
import { schemaFrom } from "./schema-generator";
import { Converter, arr, bool, str, float, obj } from "./converters";
import * as invariant from "invariant";

export interface ValidationOptions<T> {
    converter?: Converter<T>;
    readonly validators: Validator<T>[];
    validatorFactory?: (ctx: any) => Validator<T>[];
    validationSchema?: Schema;
}

export interface Schema {
    [key: string]: Schema | FullValidator<any>;
}

export interface ProcessedInput<T> {
    value?: T;
    nested?: { [key: string]: Processed<any>; };
    errors?: string[];
}

export class Processed<T> {
    constructor(copy?: ProcessedInput<T>) {
        Object.assign(this, copy);
    }

    public value?: T;
    public nested?: { [key: string]: Processed<any>; };
    public errors?: string[];

    public addErrors (...errors: string[]) {
        if (!this.errors) { this.errors = [...errors]; }
        this.errors.push(...errors);
    }

    public addNested (key: string, nested: Processed<any>) {
        if (!this.nested) { this.nested = { [key]: nested }; }
        this.nested[key] = nested;
    }

    public get hasErrors(): boolean {
        const { errors, nested } = this;
        const currentHasErrors = Boolean(errors && errors.length > 0);
        const nestedHasErrors: boolean = Boolean(nested && Object.keys(nested).reduce((result, key) => {
            return result || nested[key].hasErrors;
        }, false));
        return  currentHasErrors || nestedHasErrors;
    }

    public merge(other: Processed<T>) {
        this.errors.push(...other.errors);
        Object.keys(other.nested).forEach(key => {
            if (typeof this.nested[key] === "undefined") {
                this.nested[key] = other.nested[key];
                return;
            }
            this.nested[key].merge(other.nested[key]);
        });
        invariant(typeof this.value === "undefined" || typeof other.value === "undefined");
        if (typeof this.value === "undefined") {
            this.value = other.value;
        }
    }
}

async function validateSchema<T extends { [key: string]: any }>(
    validationSchema: Schema, input: T,
): Promise<Processed<T>> {
    const result = new Processed<T>();
    // Iterate over all keys on the validation schema and make sure all the corresponding
    // properties on the object are valid.
    await Promise.all(Object.keys(validationSchema).map(async key => {
        const schemaValue = validationSchema[key];
        const inputValue = input[key];
        // Get the validation result. If the value from the schema was a function, use it
        // as a validator, otherwise it was a nested schema.
        const schemaResult = typeof schemaValue === "function" ?
            await schemaValue(inputValue) :
            await validateSchema(schemaValue, inputValue);

        if (result.hasErrors) {
            result.nested[key] = schemaResult;
        }
    }));
    // Check that no extra keys exist on the input.
    Object.keys(input).forEach(key => {
        if (!Object.keys(validationSchema).includes(key)) {
            result.nested[key] = new Processed({ errors: [ "Unexpected key." ] });
        }
    });
    return result;
}

export interface SchemaValidator<T> {
    (value: T): Promise<Processed<T>>;
}

/**
 * Fully processes an unprocessed input value. This means conversion and validation of the value.
 *
 * @param input The input to process.
 * @param converter A function which will convert the input value into a specific type.
 * @param validators A list of validators to validate the input value.
 *
 * @return An object containing all errors and the converted value.
 */
export async function processValue<T>(
    input: any, converter: Converter<T>, validators: Validator<T>[], schema?: Schema,
): Promise<Processed<T>> {
    // If a converter existed, grab the error and the value from it. Otherwise just consider the
    // input valid.
    const { error, value } = converter ?  await converter(input) : { value: input, error: undefined };
    const processed = new Processed({ value });
    // If the converter failed there is no way to make sure the value can safely be handed to the
    // validators. Early exit with the errors emitted by the converter.
    if (error) {
        processed.addErrors(error);
        return processed;
    }
    // Execute each validator for the given input and accumulate all their results.
    const validationResults = await Promise.all(validators.map(validator => validator(value)));
    const errors = validationResults
        .filter(result => typeof result.error !== "undefined")
        .map(result => result.error);
    processed.addErrors(...errors);
    // If a schema was provided, execute it and merge the result into the current result.
    if (schema) {
        const schemaResult = await validateSchema(schema, input);
        processed.merge(schemaResult);
    }
    return processed;
}

type ValidationMap = Map<number, ValidationOptions<any>>;

/**
 * Retrieves all the validators and the converter for a given parameter at index `index` on the method with name
 * `propertyKey` on the instance of a controller `target`.
 * This function is always guaranteed to return the options. If nothing was defined yet, a new metadata key with
 * an empty options object will be defined.
 *
 * @param target The target instance of an object on which a method's parameter should be looked up.
 * @param propertyKey The name of a method on `target` on which a parameter should be decorated.
 * @param index The index of the parameter to decorate. This argument is optional. If spared, the validation is
 *              appended to the property instead of the parameter.
 *
 * @return An options object to which new validators and a converter can be appended. Is always guaranteed to return
 *         an options object.
 */
export function getParameterValidation(
    target: Object, propertyKey: string | symbol, index: number,
): ValidationOptions<any> {
    // Try to retrieve the `Map` of options with the keys being the parameter index and the value being
    // an the options object.
    const map: ValidationMap = Reflect.getMetadata("validation:parameters", target, propertyKey);

    // If no map has been found then this function has never been called for this method before. A new map needs
    // to be created and an empty options object needs to be attached.
    if (!map) {
        const newMap = new Map<number, ValidationOptions<any>>();
        const newOptions: ValidationOptions<any> = { validators: [] };
        newMap.set(index, newOptions);

        // Define the new key on the reflection metadatas.
        Reflect.defineMetadata("validation:parameters", newMap, target, propertyKey);
        return newOptions;
    }

    // If the code reaches here, a map existed and at least something has already been attached to the map.
    const options = map.get(index);

    // If no options are present, a new object needs to be created and inserted into the map.
    if (!options) {
        const newOptions: ValidationOptions<any> = { validators: [] };
        map.set(index, newOptions);
        return newOptions;
    }
    return options;
}

/**
 * Returns the validation options defined on the specified property. This will always return an
 * array. If no validations options had been defined previously, a new array is created into
 * which new options can be added.
 *
 * @param target The target instance of an object on which the property is defined.
 * @param propertyKey The name of a property on `target` which hould be decorated.
 *
 * @return An array of options objects to which new validators and a converter can be appended.
 * Is always guaranteed to return an array.
 */
export function getPropertyValidation(target: Object, propertyKey: string): ValidationOptions<any> {
    const options = Reflect.getMetadata("validation:property", target, propertyKey);
    if (!options) {
        const newOptions: ValidationOptions<any> = { validators: [] };
        Reflect.defineMetadata("validation:property", newOptions, target, propertyKey);
        return newOptions;
    }
    return options;
}

export interface ValidatedProperty {
    readonly property: string;
    readonly propertyType: Function;
}

export function getValidatedProperties(target: Object): ValidatedProperty[] {
    const properties = Reflect.getMetadata("validation:properties", target);
    if (!properties) {
        const newProperties: ValidatedProperty[] = [];
        Reflect.defineMetadata("validation:properties", newProperties, target);
        return newProperties;
    }
    return properties;
}

export interface FullValidator<T> {
    (input: any): Processed<T> | Promise<Processed<T>>;
    (target: Object, propertyKey: string | symbol, index: number): void;
    validate: (...validators: Validator<T>[]) => FullValidator<T>;
    schema: (schema: Schema) => FullValidator<T>;
    validateCtx: (factory: (ctx: any) => Validator<T>[]) => FullValidator<T>;
    validators: Validator<T>[];
    validatorFactory: (ctx: any) => Validator<T>[];
    validationSchema: Schema;
}

function isCustomClass(propertyType: Function) {
return propertyType !== Number &&
    propertyType !== String &&
    propertyType !== Boolean &&
    propertyType !== Array &&
    typeof propertyType === "function";
}

/**
 * This decorator can be applied to a parameter in a `@route` and will make sure that the input
 * can be converted to the given data type and will then convert it.
 *
 * @param converter A converter to convert the raw input.
 *
 * @return A decorator for a parameter in a @route method.
 */
export function is<T>(converter?: Converter<T>): FullValidator<T> {
    const fn: any = (...args: any[]) => {
        if (args.length !== 3) {
            // Called as a function.
            const factoryValidators = fn.validatorFactory ? fn.ValidatorFactory(this) : []; //tslint:disable-line
            return processValue(args[0], converter, [...fn.validators, ...factoryValidators], fn.validationSchema);
        }
        else if (typeof args[2] === "number") {
            // Parameter decorator.
            const options = getParameterValidation(args[0], args[1], args[2]);
            options.converter = converter;
            options.validators.push(...fn.validators);
            options.validatorFactory = fn.validationFactory;
            options.validationSchema = fn.validationSchema;
            return;
        } else {
            const propertyType = Reflect.getMetadata("design:type", args[0], args[1]);
            const arrayOfType = Reflect.getMetadata("arrayof", args[0], args[1]);
            getValidatedProperties(args[0]).push({
                property: args[1],
                propertyType,
            });
            // Property decorator.
            const options = getPropertyValidation(args[0], args[1]);
            options.converter = typeof converter === "function" ?
                converter :
                inferConverter(propertyType, arrayOfType);
            options.validationSchema = fn.validationSchema;
            if (isCustomClass(propertyType) && !options.validationSchema) {
                options.validationSchema = schemaFrom(propertyType);
            }
            options.validators.push(...fn.validators);
            options.validatorFactory = fn.validationFactory;
            return;
        }
    };
    fn.validators = [];
    fn.validate = (...validators: Validator<T>[]) => {
        fn.validators.push(...validators);
        return fn;
    };
    fn.validateCtx = (factory: (ctx: any) => Validator<T>[]) => {
        fn.validationFactory = factory;
        return fn;
    };
    fn.schema = (schema: Schema) => {
        fn.validationSchema = schema;
        return fn;
    };
    return fn as FullValidator<T>;
}

/**
 * Infers the needed converter based on the constructor type.
 *
 * @param ctor The constructor such as `Number` or `Object`.
 *
 * @return The corresponding converter.
 */
export function inferConverter(ctor: Function, arrayOfType?: Function): Converter<any> {
    if (ctor === Number) {
        return float;
    }
    if (ctor === String) {
        return str;
    }
    if (ctor === Boolean) {
        return bool;
    }
    if (ctor === Array) {
        if (arrayOfType) {
            return arr(is(inferConverter(arrayOfType)));
        }
        return arr();
    }
    return obj;
}
