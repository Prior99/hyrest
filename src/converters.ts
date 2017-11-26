import { FullValidator } from "./validation";

export interface Converted<T> {
    error?: string;
    value?: T;
}

export type Converter<T> = (input: any) => Converted<T> | Promise<Converted<T>>;

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
    return { value} ;
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
 * Makes sure the given input is an array matching the given validation.
 *
 * @param fullValidator validator to apply to all elements in the array..
 *
 * @return The input if it was a matching array and an error otherwise.
 */
export function arr<T>(fullValidator: FullValidator<T>): Converter<T[]> {
    return async (value: any) => {
        if (typeof value === "undefined") { return { value }; }
        if (!Array.isArray(value)) { return { error: "Not an array." }; }
        const error = (await Promise.all(value.map(elem => fullValidator(elem))))
                .find(result => result.errors.length > 0);
        if (error) { return { error: `Array validation failed: ${error.errors[0]}` }; }
        return { value };
    };
}
