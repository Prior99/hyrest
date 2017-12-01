import { FullValidator, Processed } from "./validation";

export interface Converted<T> {
    error?: string;
    value?: T;
}

export type Converter<T> = (input: any) => Converted<T> | Promise<Converted<T>> | Processed<T> | Promise<Processed<T>>;

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
