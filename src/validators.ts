export interface Validation {
    error?: string;
}

export type Validator<T> = (input: T) => Validation | Promise<Validation>;

/**
 * Enforces `input` to be one of the values specified in `options`.
 *
 * @param options The options of which `input` needs to be.
 *
 * @return A Converter which checks if the input is one of `options` and returns an error if that was
 *         not the case and the `input` itself otherwise.
 */
export function oneOf<T>(...options: T[]): Validator<T> {
    return (value: T) => {
        if (typeof value === "undefined") { return {}; }
        if (!options.includes(value)) { return { error: `Not one of (${options.join(", ")}).` }; }
        return {};
    };
}

/**
 * Makes sure the given input is not `null` or `undefined`.
 *
 * @param input The input to check.
 *
 * @return The input if it was not `undefined` or `null`, otherwise an error will be returned.
 */
export function required<T>(value: T): Validation {
    if (typeof value === "undefined" || value === null) { return { error: "Missing required field." }; }
    return {};
}
