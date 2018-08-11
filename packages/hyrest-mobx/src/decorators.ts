import "reflect-metadata";
import {
    PropertyMeta,
    getPropertyValidation,
    Constructable,
    populate,
    ValidationOptions,
    universal,
    getSpecifiedType,
} from "hyrest";
import { ValidationStatus } from "./validation-status";
import { ContextFactory } from "./context-factory";
import { createField } from "./field";

/**
 * Metadata created by `@field` and stored in the reflection metadata.
 */
export interface FieldsMeta {
    /**
     * A list of all `@field` properties known on the class.
     */
    fieldProperties: {
        /**
         * The name of the property.
         */
        property: string,
        /**
         * The creator type of the property specified as argument of the decorator.
         */
        modelType: any,
    }[];
}

/**
 * Will retrieve the `@field`s from a class. Will always return an object.
 * If none existed in the metadata, a new one will be created.
 *
 * @param target The object prototype to retrieve the `@field`s from.
 *
 * @return The field metadata for the target. Will create a new one if none existed.
 */
export function getFieldsMeta(target: Object): FieldsMeta {
    const fieldsMeta = Reflect.getMetadata("fields", target);
    if (fieldsMeta) { return fieldsMeta; }
    const newFields: FieldsMeta = {
        fieldProperties: [],
    };
    Reflect.defineMetadata("fields", newFields, target);
    return newFields;
}

/**
 * Class decorator. `@hasFields` can be used to decorate a class which has an `@field` property.
 * It will instanciate all field wrappers and provide them with the context factory specified
 * in the arguments. An optional `fieldFactory` can be used to augment or override the fields when
 * creating them.
 *
 * @param contextFactory A function returning the context.
 * @param fieldFactory An optional function for creating a field. Defaults to `createField`.
 */
export function hasFields<TContext>(
    contextFactory: ContextFactory<TContext> = () => undefined,
    fieldFactory: typeof createField = createField,
): ClassDecorator {
    const decorator = function <T extends Function>(target: T): T {
        // Override the class's constructor with a constructor injecting the fields.
        const constructor = function OverloadedConstructor(this: any, ...args: any[]): any {
            // Create a new instance.
            const instance = new (target as any)(...args);
            // Retrieve all `@field`s.
            const { fieldProperties } = getFieldsMeta(target);
            // Inject all fields.
            fieldProperties.forEach(({ property, modelType }) => {
                if (modelType === Array) {
                    // If the injected property is an array, inject a `FieldArray`.
                    // Get the real type by using `@specify`.
                    const { property: typeCreator } = getSpecifiedType(target.prototype, property as keyof T);
                    if (!typeCreator) {
                        throw new Error(
                            "Decorated a property of type Array with @field. Make sure to use @specify. " +
                            `Check property "${property}" on class "${constructor.name}".`,
                        );
                    }
                    const arrayType = typeCreator();
                    (instance as any)[property] = fieldFactory(arrayType, contextFactory, true);
                } else {
                    // If the injected property was not an array, inject a `FieldSimple`.
                    (instance as any)[property] = fieldFactory(modelType, contextFactory, false);
                }
            });
            return instance;
        };
        // If possible, redefine the constructor's name to the original class's name.
        // This is usefull for debugging when using React.
        try {
            Object.defineProperty(constructor, "name", {
                get () { return target.name; },
            });
        } catch (err) {
            // tslint:disable-line
        }
        // Override the class's prototype to the original prototype, to fix inheritance
        // after overriding the constructor.
        /* istanbul ignore else */
        if (typeof Object.setPrototypeOf !== "undefined") {
            Object.setPrototypeOf(constructor, target);
        } else {
            (constructor as any).__proto__ = target;
        }
        constructor.prototype = target.prototype;
        // Return the overridden constructor.
        return constructor as any;
    };
    return decorator;
}

/**
 * Property decorator. Decorate a `Field` property with this to have `@hasFields` inject the field.
 *
 * **Example:**
 *
 * ```
 * @field(User) public user: Field<User>;
 * ```
 *
 * @param modelType The wrapped type contained in the field.
 */
export function field<TModel, TContext>(modelType: Constructable<TModel>): PropertyDecorator {
    return (target: Object, property: string): void => {
        const fieldsMeta = getFieldsMeta(target.constructor);
        fieldsMeta.fieldProperties.push({ property, modelType });
    };
}
