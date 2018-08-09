import { Constructable, PropertyMeta, getPropertyValidation, getSpecifiedType, ValidationOptions } from "hyrest";
import { FieldArray } from "./field-array";
import { FieldSimple } from "./field-simple";
import { ContextFactory } from "./context-factory";

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
