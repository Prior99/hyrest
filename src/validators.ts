import { Scope } from "./scope";

export interface Validation {
    error?: string;
}

export type Validator<T> = (input: T, scope?: Scope) => Validation | Promise<Validation>;

/**
 * Enforces `input` to be one of the values specified in `options`.
 *
 * @param options The options of which `input` needs to be.
 *
 * @return A validator which checks if the input is one of `options` and returns an error if that was
 *         not the case.
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

export function length({ min, max }: { max: number, min: number }): Validator<string | any[]>;
export function length(min: number, max: number): Validator<string | any[]>;
/**
 * Validates the input string to be at least of length `min` and not longer than `max`.
 *
 * @param options An object with the keys `min` and `max` for the minimum and maximum length of the string.
 *
 * @return A validator which checks the length of the input string.
 */
export function length(arg1: { max: number, min: number } | number, arg2?: number): Validator<string | any[]> {
    const { min, max } = typeof arg1 === "object" ? arg1 : { min: arg1, max: arg2 };
    return (value: string | any[]) => {
        if (typeof value === "undefined") { return {}; }
        if (value === null) { return { error: "Cannot determine length of null." }; }
        if (typeof max !== "undefined" && value.length > max) {
            return { error: `Exceeds maximum length of ${max}.` };
        }
        if (typeof min !== "undefined" && value.length < min) {
            return { error: `Shorter than minimum length of ${min}.` };
        }
        return {};
    };
}

// Taken from http://emailregex.com/
const emailValidationRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // tslint:disable-line
// Taken from https://github.com/mixer/uuid-validate
const uuidValidationRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-4][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Validates that the input is an email.
 *
 * @param value The value to check.
 *
 * @return An error if `value` was not an email.
 */
export function email(value: string): Validation {
    if (typeof value === "undefined") { return {}; }
    if (typeof value !== "string" || !value.match(emailValidationRegex)) { // tslint:disable-line
        return { error: `String is not a valid email.` };
    }
    return {};
}

/**
 * Limits a validator to a given scope. The validator will only be executed if the scope matches.
 *
 * @param onlyScope The scope to limit the validator to.
 * @param validator The validator to execute if the scope matches.
 *
 * @return A validator only executed if the scope matches.
 */
export function only<T>(onlyScope: Scope, validator: Validator<T>): Validator<T> {
    return (value: T, currentScope: Scope) => {
        if (currentScope === onlyScope) {
            return validator(value);
        }
        return {};
    };
}

export function range({ min, max }: { max: number, min: number }): Validator<number>;
export function range(min: number, max: number): Validator<number>;
/**
 * Validates the input to be a number in the specified range.
 *
 * @param options An object with the keys `min` and `max` for the minimum and maximum length of the string.
 *
 * @return A validator which checks the range of the input string.
 */
export function range(arg1: { max: number, min: number } | number, arg2?: number): Validator<number> {
    const { min, max } = typeof arg1 === "object" ? arg1 : { min: arg1, max: arg2 };
    return (value: number) => {
        if (typeof value === "undefined") { return {}; }
        if (value === null) { return { error: "Cannot compare with null." }; }
        if (typeof max !== "undefined" && value > max) {
            return { error: `Exceeds maximum of ${max}.` };
        }
        if (typeof min !== "undefined" && value < min) {
            return { error: `Less than minimum of ${min}.` };
        }
        return {};
    };
}

/**
 * Validates that the input is an uuid.
 *
 * @param value The value to check.
 *
 * @return An error if `value` was not an uuid.
 */
export function uuid(value: string): Validation {
    if (typeof value === "undefined") { return {}; }
    if (typeof value !== "string" || !value.match(uuidValidationRegex)) {
        return { error: `String is not a valid uuid.` };
    }
    return {};
}
