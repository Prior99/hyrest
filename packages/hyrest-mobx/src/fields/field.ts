import { Constructable, PropertyMeta, getPropertyValidation, getSpecifiedType, ValidationOptions } from "hyrest";
import { FieldArray } from "./field-array";
import { FieldSimple } from "./field-simple";
import { ContextFactory } from "../types";

/**
 * A single field on a model or returned by the `@field` decorator.
 * Can be a `FieldArray` or a `SimpleField`, depending on whether it is an array.
 */
export type Field<TModel, TContext = any> =
    // If the value of the object at key `K` was an array, ...
    TModel extends any[] ? (
        // ... return a `FieldArray`.
        FieldArray<TModel[0], TContext>
    ) : (
        // ... otherwise return a simple `Field`.
        FieldSimple<TModel, TContext>
    );

export function createField<TModel extends any[], TContext>(
    modelType: Constructable<TModel[0]>,
    contextFactory: ContextFactory<TContext>,
    array: true,
    validation?: ValidationOptions<TModel, TContext>,
): FieldArray<TModel[0], TContext>;
export function createField<TModel, TContext>(
    modelType: Constructable<TModel>,
    contextFactory: ContextFactory<TContext>,
    array: false,
    validation?: ValidationOptions<TModel, TContext>,
): FieldSimple<TModel, TContext>;

/**
 * Create a new `Field` wrapper based on the provided type.
 * Might create an `FieldArray` or a `FieldSimple` based on whether it's an array or not.
 *
 * @param modelType The type of the model wrapped in the returned `Field`.
 * @param contextFactory A context factory handed down to the new `Field` which will use it to provide the app's
 *     context to the validation.
 * @param array When set to `true` a `FieldArray` will be created.
 * @param validation An optional validation option metadata as retrieved by `getPropertyValidation`.
 *
 * @return The newly created `FieldSimple` or `FieldArray`.
 */
export function createField<TModel, TContext>(
    modelType: Constructable<TModel>,
    contextFactory: ContextFactory<TContext>,
    array: boolean,
    validation?: ValidationOptions<TModel, TContext>,
): Field<TModel, TContext> {
    // The casts to `any` are neccessary as Typescript cannot deal with this
    // kind of types. See https://github.com/Microsoft/TypeScript/issues/22628 (for example).
    if (array) {
        return new FieldArray<TModel, TContext>(modelType, contextFactory, validation) as any;
    } else {
        return new FieldSimple<TModel, TContext>(modelType, contextFactory, validation) as any;
    }
}
