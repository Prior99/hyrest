import "reflect-metadata";

import { Validator, Validation } from "./validators";
import { schemaFrom } from "./schema-generator";
import { Converter, bool, str, float, obj } from "./converters";
import * as invariant from "invariant";
import { Scope } from "./scope";

export interface ValidationOptions<T> {
    converter?: Converter<T>;
    readonly validators: Validator<T>[];
    validatorFactory?: (ctx: any) => Validator<T>[];
    validationSchema?: Schema;
    scopeLimit?: Scope;
}

export interface Schema {
    [key: string]: Schema | FullValidator<any>;
}

export interface ProcessedInput<T> {
    value?: T;
    nested?: {
        [key: number]: Processed<any> | Processed<any>[];
        [key: string]: Processed<any> | Processed<any>[];
    };
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
        if (errors.length === 0) {
            return;
        }
        if (!this.errors) {
            this.errors = [...errors];
            return;
        }
        this.errors.push(...errors);
    }

    public addNested (key: string | number, nested: Processed<any>) {
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
        if (typeof other === "undefined" || other === null) {
            return;
        }
        if (typeof other.errors !== "undefined") {
            if (this.errors) {
                this.errors.push(...other.errors);
            } else {
                this.errors = [...other.errors];
            }
        }
        if (typeof other.nested !== "undefined" && other.nested !== null) {
            Object.keys(other.nested).forEach(key => {
                if (typeof this.nested === "undefined" || typeof this.nested[key] === "undefined") {
                    this.addNested(key, other.nested[key]);
                    return;
                }
                this.nested[key].merge(other.nested[key]);
            });
        }
        if (typeof this.value === "undefined" && typeof other.value !== "undefined") {
            this.value = other.value;
        }
    }
}

export async function validateSchema<T extends { [key: string]: any }>(
    validationSchema: Schema, input: T, scope?: Scope,
): Promise<Processed<T>> {
    const result = new Processed<T>();
    const origin = Reflect.getMetadata("validation:schema:origin", validationSchema);
    const classProperties = typeof scope !== "undefined" && scope.propertiesForClass(origin.constructor);
    const validationKeys = Object.keys(validationSchema).filter(key => {
        return !classProperties ||
            classProperties.find(property => property.target === origin && property.property === key);
    });
    // Iterate over all keys on the validation schema and make sure all the corresponding
    // properties on the object are valid.
    await Promise.all(validationKeys.map(async key => {
        const schemaValue = validationSchema[key];
        const inputValue = input ? input[key] : undefined;
        // Get the validation result. If the value from the schema was a function, use it
        // as a validator, otherwise it was a nested schema.
        const schemaResult = typeof schemaValue === "function" ?
            await schemaValue(inputValue, scope) :
            await validateSchema(schemaValue, inputValue, scope);

        if (schemaResult.hasErrors) {
            result.addNested(key, schemaResult);
        }
    }));
    if (typeof input !== "undefined" && input !== null && !Array.isArray(input)) {
        // Check that no extra keys exist on the input.
        Object.keys(input).forEach(key => {
            if (!validationKeys.includes(key)) {
                result.addNested(key, new Processed({ errors: [ "Unexpected key." ] }));
            }
        });
    }
    return result;
}

export interface SchemaValidator<T> {
    (value: T): Promise<Processed<T>>;
}

export function arr<T>(validator?: FullValidator<T>): Converter<T[]> {
    return async (value: any) => {
        const processed = new Processed<T[]>();
        if (typeof value === "undefined") { return processed; }
        if (!Array.isArray(value)) {
            processed.addErrors("Not an array.");
            return processed;
        }
        if (typeof validator !== "undefined"){
            await Promise.all(value.map(async (elem, index) => {
                const result = await validator(elem);
                if (result.hasErrors) {
                    processed.addNested(index, result);
                }
            }));
        }
        return processed;
    };
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
    input: any, converter: Converter<T>, validators: Validator<T>[], schema?: Schema, scope?: Scope,
): Promise<Processed<T>> {
    const processed = new Processed<T>();
    // If a converter existed, grab the error and the value from it. Otherwise just consider the
    // input valid.
    let value: T;
    const conversionResult = converter && await converter(input);
    if (typeof converter === "undefined") {
        value = input;
    }
    if (conversionResult instanceof Processed) {
        processed.merge(conversionResult);
        value = processed.value;
    }
    else if (typeof conversionResult !== "undefined") {
        if (conversionResult.error) {
            // If the converter failed there is no way to make sure the value can safely be handed to the
            // validators. Early exit with the errors emitted by the converter.
            processed.addErrors(conversionResult.error);
            return processed;
        }
        value = conversionResult.value;
    }
    // Execute each validator for the given input and accumulate all their results.
    const validationResults = await Promise.all(validators.map(validator => validator(value)));
    const errors = validationResults
        .filter(result => typeof result.error !== "undefined")
        .map(result => result.error);
    processed.addErrors(...errors);
    // If a schema was provided, execute it and merge the result into the current result.
    if (schema) {
        const schemaResult = await validateSchema(schema, input, scope);
        processed.merge(schemaResult);
    }
    if (typeof value !== "undefined" && !processed.hasErrors) {
        processed.value = value;
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
    (input: any, scope?: Scope): Processed<T> | Promise<Processed<T>>;
    (target: Object, propertyKey: string | symbol, index: number): void;
    validate: (...validators: Validator<T>[]) => FullValidator<T>;
    schema: (schema: Schema) => FullValidator<T>;
    validateCtx: (factory: (ctx: any) => Validator<T>[]) => FullValidator<T>;
    validators: Validator<T>[];
    validatorFactory: (ctx: any) => Validator<T>[];
    validationSchema: Schema;
    scopeLimit?: Scope;
    scope: (scope: Scope) => FullValidator<T>;
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
            return processValue(
                args[0],
                converter,
                [...fn.validators, ...factoryValidators],
                fn.validationSchema,
                fn.scopeLimit || args[1],
            );
        }
        const isParameterDecorator = typeof args[2] === "number";
        const options = isParameterDecorator ?
            getParameterValidation(args[0], args[1], args[2]) :
            getPropertyValidation(args[0], args[1]);
        options.converter = converter;
        options.validatorFactory = fn.validationFactory;
        options.validationSchema = fn.validationSchema;
        options.validators.push(...fn.validators);
        options.scopeLimit = fn.scopeLimit;
        if (!isParameterDecorator) {
            // Property decorator.
            const propertyType = Reflect.getMetadata("design:type", args[0], args[1]);
            const arrayOfType = Reflect.getMetadata("arrayof", args[0], args[1]);
            getValidatedProperties(args[0]).push({
                property: args[1],
                propertyType,
            });
            if (typeof converter === "undefined") {
                options.converter = inferConverter(propertyType, arrayOfType);
            }
            if (propertyType === Array && typeof arrayOfType === "undefined") {
                throw new Error("Decorated property of type array without specifying @arrayOf after @is.");
            }
            if (isCustomClass(propertyType) && !options.validationSchema) {
                if (propertyType === Array) {
                    options.validationSchema = schemaFrom(arrayOfType);
                } else {
                    options.validationSchema = schemaFrom(propertyType);
                }

            }
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
    fn.scope = (scope: Scope) => {
        fn.scopeLimit = scope;
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
    if (ctor === Number || ctor === float) {
        return float;
    }
    if (ctor === String || ctor === str) {
        return str;
    }
    if (ctor === Boolean || ctor === bool) {
        return bool;
    }
    if (ctor === Array) {
        if (arrayOfType) {
            const validator = is(inferConverter(arrayOfType));
            if (isCustomClass(arrayOfType)) {
                validator.schema(schemaFrom(arrayOfType));
            }
            return arr(validator);
        }
        return arr();
    }
    return obj;
}
