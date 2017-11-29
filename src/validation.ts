import "reflect-metadata";

import { Validator, Validation } from "./validators";
import { schemaFrom } from "./schema-generator";
import { Converter, arr, bool, str, float, obj } from "./converters";

export interface ValidationOptions<T> {
    converter?: Converter<T>;
    readonly validators: Validator<T>[];
    validatorFactory?: (ctx: any) => Validator<T>[];
}

export interface Schema {
    [key: string]: Schema | FullValidator<any>;
}

export interface Processed<T> {
    value?: T;
    errors: string[];
}

async function validateSchema<T extends Object>(validationSchema: Schema, input: T): Promise<boolean> {
    const result = await Promise.all(Object.keys(validationSchema).map(async key => {
        const schemaValue = validationSchema[key];
        const inputValue = (input as any)[key];

        if (typeof schemaValue === "function") {
            return (await schemaValue(inputValue)).errors.length === 0;
        }

        return await validateSchema(schemaValue, inputValue);
    }));
    const noAdditionalKeys = Object.keys(input).every(key => Object.keys(validationSchema).includes(key));
    return result.every(keyResult => keyResult) && noAdditionalKeys;
}

export function schema<T extends Object>(validationSchema: Schema): Validator<T> {
    return async (value: T) => {
        if (typeof value === "undefined") {
            return {};
        }
        return (await validateSchema(validationSchema, value)) ? {} : { error: "Schema validation failed." };
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
        input: any, converter: Converter<T>, validators: Validator<T>[]): Promise<Processed<T>> {
    const { error, value } = converter ?
            await converter(input) :
            { value: input, error: undefined };
    if (error) {
        return {
            errors: [error],
        };
    }
    const errors = (await Promise.all(validators.map(validator => validator(value))))
        .reduce((result, { error: validationError }) => {
            if (validationError) {
                result.push(validationError);
            }
            return result;
        }, []);
    return { value, errors };
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
    validateCtx: (factory: (ctx: any) => Validator<T>[]) => FullValidator<T>;
    validators: Validator<T>[];
    validatorFactory: (ctx: any) => Validator<T>[];
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
            return processValue(args[0], converter, [...fn.validators, ...factoryValidators]);
        }
        else if (typeof args[2] === "number") {
            // Parameter decorator.
            const options = getParameterValidation(args[0], args[1], args[2]);
            options.converter = converter;
            options.validators.push(...fn.validators);
            options.validatorFactory = fn.validationFactory;
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
    if (ctor === Object) {
        return obj;
    }
    if (ctor === Array) {
        if (arrayOfType) {
            return arr(is(inferConverter(arrayOfType)));
        }
        return arr();
    }
    if (ctor === Function) {
        return schema(schemaFrom(ctor));
    }
}
