import { FullValidator } from "./validation";
import { Processed } from "./processed";
import { Scope } from "./scope";

export interface Converted<T> {
    error?: string;
    value?: T;
}

export type Converter<T> = (input: any, scope?: Scope, context?: any) =>
    Converted<T> |
    Promise<Converted<T>> |
    Processed<T> |
    Promise<Processed<T>>;

/**
 * Converts the given input to an integer if possible.
 *
 * @param input The input to convert to an integer. Can be anything in any form.
 *
 * @return An integer if the conversion succeeded or an error if the input was not a valid
 *         integer.
 */
export function int(input: any): Converted<number> {
    if (typeof input === "undefined") { return { value: input }; }
    const value = parseInt(input);
    if (isNaN(value) || parseFloat(input) !== value) { return { error: "Not a valid integer." }; }
    return { value };
}

/**
 * Converts the given input to a float if possible.
 *
 * @param input The input to convert to a float. Can be anything in any form.
 *
 * @return A float if the conversion succeeded or an error if the input was not a valid
 *         float.
 */
export function float(input: any): Converted<number> {
    if (typeof input === "undefined") { return { value: input }; }
    const value = parseFloat(input);
    if (isNaN(value)) { return { error: "Not a valid float." }; }
    return { value };
}

/**
 * Makes sure the given input is a string.
 *
 * @param input The input to check.
 *
 * @return The string in `input` if it was a string and an error otherwise.
 */
export function str(value: any): Converted<string> {
    if (typeof value === "undefined") { return { value }; }
    if (typeof value !== "string") { return { error: "Not a valid string." }; }
    return { value };
}

/**
 * Makes sure the given input is an object.
 *
 * @param input The input to check.
 *
 * @return The input if it was an object and an error otherwise.
 */
export function obj(value: any): Converted<Object> {
    if (typeof value === "undefined") { return { value }; }
    if (typeof value !== "object" || Array.isArray(value)) { return { error: "Not a valid object."}; }
    return { value };
}

/**
 * Makes sure the given input is a boolean.
 *
 * @param input The input to check.
 *
 * @return The boolean in `input` if it was a boolean and an error otherwise.
 */
export function bool(value: any): Converted<boolean> {
    if (typeof value === "undefined") { return { value }; }
    if (value === "true" || value === "false") { return { value: value === "true" }; }
    if (typeof value !== "boolean") { return { error: "Not a valid boolean." }; }
    return { value };
}

/**
 * Makes sure the given input is an array with all elements matching the given criteria.
 *
 * @param validator A validator to apply to all element of the array.
 *
 * @return The array converter.
 */
export function arr<T, TContext>(validator?: FullValidator<T, TContext>): Converter<T[]> {
    return async (value: any, scope?: Scope, context?: any) => {
        const processed = new Processed<T[]>();
        // Ignore `undefined` inputs. This is handled by the `required` validator if intended by
        // the user.
        if (typeof value === "undefined") { return processed; }
        // If the input is not an array at all, don't even try to validate any elements.
        if (!Array.isArray(value)) {
            processed.addErrors("Not an array.");
            return processed;
        }
        // Apply the validator (if provided) to all elements and store the results in the `nested`
        // property of the result. The keys will be the array indices.
        if (typeof validator !== "undefined"){
            const results = await Promise.all(value.map(async (elem, index) => {
                const result = await validator(elem, { scope, context });
                if (result.hasErrors) {
                    processed.addNested(index, result);
                }
                return result;
            }));
            if (!results.find(result => result.hasErrors)) {
                processed.value = results.map(result => result.value);
            }
            return processed;
        }
        processed.value = value;
        return processed;
    };
}

/**
 * Makes sure the given input is `null`.
 *
 * @param input The input to check.
 *
 * @return `null` if it was a `null` and an error otherwise.
 */
export function empty(value: any): Converted<null> {
    if (value === null) { return { value }; }
    return { error: "Not null." };
}
