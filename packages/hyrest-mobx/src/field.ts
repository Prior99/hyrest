import { PropertyMeta, getPropertyValidation, getSpecifiedType } from "hyrest";
import { FieldArray } from "./field-array";
import { FieldSimple } from "./field-simple";
import { ContextFactory } from "./context-factory";

/**
 * A single field on a model or returned by the `@field` decorator.
 * Can be a `FieldArray` or a `SimpleField`, depending on whether it is an array.
 */
export type Field<TModel, TContext> =
    // If the value of the object at key `K` was an array, ...
    TModel extends any[] ? (
        // ... return a `FieldArray`.
        FieldArray<TModel[0], TContext>
    ) : (
        // ... otherwise return a simple `Field`.
        FieldSimple<TModel, TContext>
    );

export function createField<TModel extends any[], TContext>(
    propertyMeta: PropertyMeta,
    contextFactory: ContextFactory<TContext>,
): FieldArray<TModel[0], TContext>;
export function createField<TModel, TContext>(
    propertyMeta: PropertyMeta,
    contextFactory: ContextFactory<TContext>,
): FieldSimple<TModel, TContext>;
export function createField<TModel, TContext>(
    { expectedType, target, property }: PropertyMeta,
    contextFactory: ContextFactory<TContext>,
): Field<TModel, TContext> {
    // The casts to `any` are neccessary as Typescript cannot deal with this
    // kind of types. See https://github.com/Microsoft/TypeScript/issues/22628 (for example).
    if (expectedType === Array) {
        const modelType = getSpecifiedType(target, property);
        type TModelArray = TModel & any[];
        return new FieldArray<TModelArray, TContext>(
            modelType.property(),
            contextFactory,
            getPropertyValidation(target, property),
        ) as any;
    } else {
        return new FieldSimple<TModel, TContext>(
            expectedType,
            contextFactory,
            getPropertyValidation(target, property),
        ) as any;
    }
}
