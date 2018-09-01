import { Field } from "./field";
/**
 * The type of nested fields on a field.
 * This wraps all keys and values of `TModel` in either `FieldArray` or `Field`.
 */
export type Fields<TModel, TContext> = {
    // Iterate over all keys in `TModel`.
    // The key has to be defined always, but its value can be `undefined`.
    [K in keyof TModel]: Field<TModel[K], TContext> | undefined;
};
