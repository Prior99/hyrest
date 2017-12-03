import "reflect-metadata";

import { Validator, Validation } from "./validators";
import { schemaFrom } from "./schema-generator";
import { Converter, bool, str, float, obj, arr } from "./converters";
import * as invariant from "invariant";
import { Scope } from "./scope";
import { Processed } from "./processed";

export interface ValidationOptions<T> {
    /**
     * The converter to convert the input with.
     */
    converter?: Converter<T>;
    /**
     * A list of all validators the check the input with.
     */
    validators: Validator<T>[];
    /**
     * A factory function to call with the current context of the
     * decorator which will return a list of validators.
     */
    validatorFactory?: (ctx: any) => Validator<T>[] | Validator<T>;
    /**
     * An optional schema to match the inputs against.
     */
    validationSchema?: Schema;
    /**
     * An optional scope to limit the schema validation to. Only possible if the
     * schema was inferred from a class.
     */
    scopeLimit?: Scope;
}

export interface Schema {
    [key: string]: Schema | FullValidator<any, any>;
}

/**
 * Represents one validated property on a class. This is the result stored
 * in the reflection metadata as retrieved by `getValidatedProperties`.
 *
 * @see getValidatedProperties
 */
export interface ValidatedProperty {
    readonly property: string;
    readonly propertyType: Function;
}

/**
 * A full set of recursive validators featuring schema, array and value validation.
 */
export interface FullValidator<T, TContext> {
    /**
     * Call the validator manually with a value and an optional scope to limit the
     * validation to.
     *
     * @param input The input to validate.
     * @param scope The scop to limit the validation to. This only works with schemas inferred from classes.
     *
     * @see Scope
     * @see schemaFrom
     *
     * @return The result of validating the value.
     */
    (input: any, options: { scope?: Scope; context?: any; }): Processed<T> | Promise<Processed<T>>;
    /**
     * Call the function as a parameter decorator.
     */
    (target: Object, propertyKey: string | symbol, index: number): void;
    /**
     * Call the function as a property decorator.
     */
    (target: Object, propertyKey: string, descriptor?: PropertyDescriptor): void;
    /**
     * Add a set of validators to the validator.
     *
     * @param validators A list of validators to add to this validator.
     *
     * @return The same instance to use this method as a builder pattern.
     */
    validate: (...validators: Validator<T>[]) => FullValidator<T, TContext>;
    /**
     * Set the schema to validate the object with.
     *
     * @param schema The schema to use for validation.
     *
     * @return The same instance to use this method as a builder pattern.
     */
    schema: (schema: Schema) => FullValidator<T, TContext>;
    /**
     * Add a set of validators to the validator using a factory function which receives the current context
     * of the decorator as an argument.
     *
     * @param factory A function taking the current context of the decorator as an argument, returning
     *                a list of validators.
     *
     * @return The same instance to use this method as a builder pattern.
     */
    validateCtx: (factory: (ctx: any) => (Validator<T>[] | Validator<T>)) => FullValidator<T, TContext>;
    /**
     * Limit the scope of the schema validation to certain properties decorated with `@scope`.
     * This only works with a schema inferred from a class.
     *
     * @param scope The scope to limit the validation to.
     *
     * @see Scope
     * @see schemaFrom
     *
     * @return The same instance to use this method as a builder pattern.
     */
    scope: (scope: Scope) => FullValidator<T, TContext>;
    /**
     * All validators attached to this validator.
     */
    validators: Validator<T>[];
    /**
     * An optional factory function to create validators depending on the current context with.
     */
    validatorFactory?: (ctx: TContext) => (Validator<T>[] | Validator<T>);
    /**
     * An optional schema to validate the input object with.
     */
    validationSchema?: Schema;
    /**
     * An optional scope to limit schema validations with schemas inferred from classes with.
     */
    scopeLimit?: Scope;
}

/**
 * Performs a schema validation of a given input optionally in the context of a given scope.
 *
 * @param validationSchema The schema to validate the input with.
 * @param input The input to validate with the given schema
 * @param scope An optional scope to limit the validation to. This only works with schemas
 *              inferred from classes as it references the `@scope` decorators.
 *
 * @see Scope
 * @see Processed
 * @see schemaFrom
 *
 * @return The result of validating the input.
 */
export async function validateSchema<T extends { [key: string]: any }>(
    validationSchema: Schema, input: T, scope?: Scope, context?: any,
): Promise<Processed<T>> {
    const result = new Processed<T>();
    // The class the schema originated from. Will only be set if the schema was inferred from a class.
    const origin = Reflect.getMetadata("validation:schema:origin", validationSchema);
    // All properties available in the current scope on the current class.
    const classProperties = typeof scope !== "undefined" && scope.propertiesForClass(origin.constructor);
    // All keys on the schema that a currently relevant (depending on the scope).
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
            await schemaValue(inputValue, { scope, context }) :
            await validateSchema(schemaValue, inputValue, scope, context);

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
    input: any,
    converter: Converter<T>,
    validators: Validator<T>[],
    schema?: Schema,
    scope?: Scope,
    context?: any,
): Promise<Processed<T>> {
    const processed = new Processed<T>();
    // If a converter existed, grab the error and the value from it. Otherwise just consider the
    // input valid.
    let value: T;
    const conversionResult = converter && await converter(input, scope, context);
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
        const schemaResult = await validateSchema(schema, input, scope, context);
        processed.merge(schemaResult);
    }
    if (typeof value !== "undefined" && !processed.hasErrors) {
        processed.value = value;
    }
    return processed;
}

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
    const map: Map<number, ValidationOptions<any>> = Reflect.getMetadata("validation:parameters", target, propertyKey);

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

/**
 * Returns all properties on the given target which are decorated with `@is` in any way.
 *
 * @param target The instance to retrieve the validated properties from.
 *
 * @return A list of validated properties.
 */
export function getValidatedProperties(target: Object): ValidatedProperty[] {
    const properties = Reflect.getMetadata("validation:properties", target);
    if (!properties) {
        const newProperties: ValidatedProperty[] = [];
        Reflect.defineMetadata("validation:properties", newProperties, target);
        return newProperties;
    }
    return properties;
}

/**
 * Checks if the typescript property type of a decorated property is a primitive
 * built-in type or a class the user has provided.
 *
 * @param propertyType The type of the property to check for.
 *
 * @return `true` if the type is a class the user has created and `false` if it was
 *         a built-in type.
 */
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
export function is<T, TContext>(converter?: Converter<T>): FullValidator<T, TContext> {
    // This function can be called in three ways:
    // 1. Standalone, providing an input and an optional scope
    // 2. As a property decorator.
    // 3. As a parameter decorator.
    const fn: any = (...args: any[]) => {
        if (args.length !== 3) {
            // Called as a function.
            // Create all factory validators.
            const { validators, validationSchema, validationFactory } = fn;
            const scope = fn.scopeLimit || (args[1] && args[1].scope);
            const context = args[1] && args[1].context;
            const factoryResult = validationFactory ? validationFactory(context) : [];
            const factoryValidators = Array.isArray(factoryResult) ? factoryResult : [factoryResult];
            const allValidators = [...validators, ...factoryValidators];
            return processValue(args[0], converter, allValidators, validationSchema, scope, context);
        }
        // Either a parameter or property decorator.
        const isParameterDecorator = typeof args[2] === "number";
        const options = isParameterDecorator ?
            getParameterValidation(args[0], args[1], args[2]) :
            getPropertyValidation(args[0], args[1]);

        // Copy all properties set on the function using the builder pattern and `validate` or `schema`, etc.
        // to the `options` object in the metadata if this was called as a decorator.
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
            // Infer the converter if it wasn't defined.
            if (typeof converter === "undefined") {
                options.converter = inferConverter(propertyType, arrayOfType);
            }
            // If the user decorated an array but forgot the `@arrayOf` decorator or specified it before `@is`,
            // fail early.
            if (propertyType === Array && typeof arrayOfType === "undefined") {
                throw new Error("Decorated property of type array without specifying @arrayOf after @is.");
            }
            // Infer the schema if the typescript property type was a custom schema.
            if (isCustomClass(propertyType) && !options.validationSchema) {
                options.validationSchema = schemaFrom(propertyType);
            }
            return;
        }
    };
    // Create all configuration functions on `fn` for the builder pattern.
    fn.validators = [];
    fn.validate = (...validators: Validator<T>[]) => {
        fn.validators.push(...validators);
        return fn;
    };
    fn.validateCtx = (factory: (ctx: TContext) => (Validator<T>[] | Validator<T>)) => {
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
    return fn as FullValidator<T, TContext>;
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
