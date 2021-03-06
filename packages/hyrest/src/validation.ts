import "reflect-metadata";
import { Constructable } from "./types";
import { Validator, Validation } from "./validators";
import { schemaFrom } from "./schema-generator";
import { Converter, bool, str, float, obj, arr, empty } from "./converters";
import * as invariant from "invariant";
import { Scope, getSpecifiedType, TypeCreator, scope as scopeDecorator, universal } from "./scope";
import { Processed } from "./processed";

export interface ValidationOptions<T, TContext> {
    fullValidator?: FullValidator<T[keyof T], TContext>;
}

export interface Schema {
    [key: string]: Schema | FullValidator<any, any>;
}

export interface IsOptions {
    nullable?: boolean;
}

/**
 * Represents one validated property on a class. This is the result stored
 * in the reflection metadata as retrieved by `getValidatedProperties`.
 *
 * @see getValidatedProperties
 */
export interface ValidatedProperty<T extends Object> {
    readonly property: keyof T;
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
    (input: any, options?: FullValidatorIvokationOptions<TContext>): Processed<T> | Promise<Processed<T>>;
    /**
     * Call the function as a parameter decorator.
     */
    <Parent>(target: Parent, propertyKey: keyof Parent, index: number): void;
    /**
     * Call the function as a property decorator.
     */
    <Parent>(target: Parent, propertyKey: keyof Parent, descriptor?: PropertyDescriptor): void;
    /**
     * Add a set of validators to the validator.
     *
     * @param validators A list of validators to add to this validator.
     *
     * @return The same instance to use this method as a builder pattern.
     */
    validate?: (...validators: Validator<T>[]) => FullValidator<T, TContext>;
    /**
     * Set the schema to validate the object with.
     *
     * @param schema The schema to use for validation.
     *
     * @return The same instance to use this method as a builder pattern.
     */
    schema?: (schema: Schema) => FullValidator<T, TContext>;
    /**
     * Add a set of validators to the validator using a factory function which receives the current context
     * of the decorator as an argument.
     *
     * @param factory A function taking the current context of the decorator as an argument, returning
     *                a list of validators.
     *
     * @return The same instance to use this method as a builder pattern.
     */
    validateCtx?: (factory: (ctx: any) => (Validator<T>[] | Validator<T>)) => FullValidator<T, TContext>;
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
    scope?: (scope: Scope) => FullValidator<T, TContext>;
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
    if (typeof input === "undefined" || input === null) {
        return result;
    }
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
        const inputValue = input[key];
        // Get the validation result. If the value from the schema was a function, use it
        // as a validator, otherwise it was a nested schema.
        const schemaResult = typeof schemaValue === "function" ?
            await schemaValue(inputValue, { scope, context }) :
            await validateSchema(schemaValue, inputValue, scope, context);

        if (schemaResult.hasErrors) {
            result.addNested(key, schemaResult);
        }
    }));
    if (!Array.isArray(input)) {
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
    configuration: IsOptions = { nullable: false },
): Promise<Processed<T>> {
    const processed = new Processed<T>();
    // If a converter existed, grab the error and the value from it. Otherwise just consider the
    // input valid.
    let value: T;
    const conversionResult = input === null && configuration.nullable
        ? empty(input)
        : (converter && await converter(input, scope, context));
    if (typeof converter === "undefined") {
        value = input;
    }
    if (conversionResult instanceof Processed) {
        // Value might exist on `conversionResult` but it is not yet safe to attach the value
        // to the result which is being returned. All validators need to be executed first.
        // The value will be attached later and will be delete for now.
        processed.merge(conversionResult, { skipValue: true });
        if (processed.hasErrors) {
            return processed;
        }
        value = conversionResult.value;
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
    const validationResults = await Promise.all(validators.map(validator => validator(value, scope)));
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
export function getParameterValidation<T extends Object, TContext>(
    target: T, propertyKey: keyof T, index: number,
): ValidationOptions<T, TContext> {
    // Try to retrieve the `Map` of options with the keys being the parameter index and the value being
    // an the options object.
    const map: Map<number, ValidationOptions<T, TContext>> =
        Reflect.getMetadata("validation:parameters", target, propertyKey as string | symbol);

    // If no map has been found then this function has never been called for this method before. A new map needs
    // to be created and an empty options object needs to be attached.
    if (!map) {
        const newMap = new Map<number, ValidationOptions<T, TContext>>();
        const newOptions: ValidationOptions<T, TContext> = {};
        newMap.set(index, newOptions);

        // Define the new key on the reflection metadatas.
        Reflect.defineMetadata("validation:parameters", newMap, target, propertyKey as string | symbol);
        return newOptions;
    }

    // If the code reaches here, a map existed and at least something has already been attached to the map.
    const options = map.get(index);

    // If no options are present, a new object needs to be created and inserted into the map.
    if (!options) {
        const newOptions: ValidationOptions<T, TContext> = {};
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
export function getPropertyValidation<T extends Object, TContext>(
    target: T, propertyKey: keyof T,
): ValidationOptions<T, TContext> {
    const options = Reflect.getMetadata("validation:property", target, propertyKey as string | symbol);
    if (!options) {
        const newOptions: ValidationOptions<T, TContext> = {};
        Reflect.defineMetadata("validation:property", newOptions, target, propertyKey as string | symbol);
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
export function getValidatedProperties<T extends Object>(target: T): ValidatedProperty<T>[] {
    const properties = Reflect.getMetadata("validation:properties", target);
    if (!properties) {
        const newProperties: ValidatedProperty<T>[] = [];
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
export function isCustomClass(propertyType: Function) {
    return propertyType !== Number &&
        propertyType !== String &&
        propertyType !== Boolean &&
        propertyType !== Array &&
        typeof propertyType === "function";
}

export interface FullValidatorIvokationOptions<TContext> {
    scope?: Scope;
    context: TContext;
}

/**
 * This decorator can be applied to a parameter in a `@route` and will make sure that the input
 * can be converted to the given data type and will then convert it.
 *
 * @param converter A converter to convert the raw input.
 *
 * @return A decorator for a parameter in a @route method.
 */
export function is<ValueType, TContext>(
    converter?: Converter<ValueType>,
    configuration?: IsOptions,
): FullValidator<ValueType, TContext>;
export function is<U, K extends keyof U, ValueType extends U[K], TContext>(
    converter?: Converter<ValueType>,
    configuration: IsOptions = { nullable: false },
): FullValidator<ValueType, TContext> {
    // A list of all validators the check the input with.
    const validators: Validator<ValueType>[] = [];
    // A factory function to call with the current context of the
    // decorator which will return a list of validators.
    let validatorFactory: (ctx: any) => Validator<ValueType>[] | Validator<ValueType>;
    // An optional schema to match the inputs against.
    let validationSchema: Schema;
    // An optional scope to limit the schema validation to. Only possible if the
    // schema was inferred from a class.
    let scopeLimit: Scope;
    let fullValidator: FullValidator<ValueType, TContext>;
    let propertyType: Function;
    let specifyTypeCreator: TypeCreator<any>;
    const invoke = (value: ValueType, options?: FullValidatorIvokationOptions<TContext>) => {
        const guardedScopeLimit = scopeLimit ? scopeLimit : options.scope;
        const context = options && options.context;
        const factoryResult = validatorFactory ? validatorFactory(context) : [];
        const factoryValidators = Array.isArray(factoryResult) ? factoryResult : [factoryResult];
        const allValidators = [...validators, ...factoryValidators];
        const typeUnknown = typeof propertyType === "undefined" &&
            typeof converter === "undefined" &&
            typeof specifyTypeCreator === "undefined";
        const specifyType = specifyTypeCreator && specifyTypeCreator();
        if (typeUnknown) {
            throw new Error("Cannot infer type. Perhaps a cyclic dependency? Use @specify or provide a converter.");
        }
        // Infer the converter if it wasn't defined.
        const guardedConverter = typeof converter !== "undefined" ?
            converter :
            inferConverter(propertyType, specifyType);
        // Infer the schema if the typescript property type was a custom schema.
        const inferSchema = typeof (propertyType || specifyType) !== "undefined" &&
            (isCustomClass(specifyType) || isCustomClass(processValue)) &&
            !validationSchema &&
            guardedConverter === obj;
        const guardedSchema = inferSchema ? schemaFrom(propertyType || specifyType) : validationSchema;
        return processValue(
            value,
            guardedConverter,
            allValidators,
            guardedSchema,
            guardedScopeLimit,
            context,
            configuration,
        );
    };
    const propertyDecorator = (target: U, property: keyof U, descriptor: PropertyDescriptor) => {
        const options = getPropertyValidation(target, property);
        options.fullValidator = fullValidator;
        propertyType = Reflect.getMetadata("design:type", target, property as string | symbol);
        specifyTypeCreator = getSpecifiedType(target, property).property;
        // If the user decorated an array but forgot the `@specify` decorator or specified it before `@is`,
        // fail early.
        if (propertyType === Array && typeof specifyTypeCreator === "undefined") {
            throw new Error("Decorated property of type array without specifying @specify after @is.");
        }
        getValidatedProperties(target).push({
            property,
            propertyType,
        });
        // Add all validated properties to the `universal` scope always.
        scopeDecorator(universal)(target, property, descriptor);
        return;
    };
    const parameterDecorator = (target: U, property: keyof U, index: number) => {
        const options = getParameterValidation(target, property, index);
        options.fullValidator = fullValidator;
        propertyType = Reflect.getMetadata("design:paramtypes", target, property as string | symbol)[index];
        specifyTypeCreator = getSpecifiedType(target, property).params.get(index);
    };
    // This function can be called in three ways:
    // 1. Standalone, providing an input and an optional scope
    // 2. As a property decorator.
    // 3. As a parameter decorator.
    fullValidator = (...args: any[]) => {
        if (args.length !== 3) {
            return invoke(args[0] as ValueType, args[1] as FullValidatorIvokationOptions<TContext>);
        }
        // Either a parameter or property decorator.
        if (typeof args[2] === "number") {
            parameterDecorator(args[0], args[1], args[2]);
            return;
        }
        propertyDecorator(args[0], args[1], args[2]);
    };
    // Create all configuration functions on `fullValidator` for the builder pattern.
    fullValidator.validate = (...newValidators: Validator<ValueType>[]) => {
        validators.push(...newValidators);
        return fullValidator;
    };
    fullValidator.validateCtx = (factory: (ctx: TContext) => (Validator<ValueType>[] | Validator<ValueType>)) => {
        validatorFactory = factory;
        return fullValidator;
    };
    fullValidator.schema = (schema: Schema) => {
        validationSchema = schema;
        return fullValidator;
    };
    fullValidator.scope = (limit: Scope) => {
        scopeLimit = limit;
        return fullValidator;
    };
    return fullValidator;
}

/**
 * Infers the needed converter based on the constructor type.
 *
 * @param ctor The constructor such as `Number` or `Object`.
 *
 * @return The corresponding converter.
 */
export function inferConverter(ctor: Function, specifyType?: Function): Converter<any> {
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
        if (specifyType) {
            const validator = is(inferConverter(specifyType));
            if (isCustomClass(specifyType)) {
                validator.schema(schemaFrom(specifyType));
            }
            return arr(validator);
        }
        return arr();
    }
    return obj;
}
