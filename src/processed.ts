export interface ProcessedInput<T> {
    value?: T;
    nested?: {
        [key: number]: Processed<any> | Processed<any>[];
        [key: string]: Processed<any> | Processed<any>[];
    };
    errors?: string[];
}

export interface MergeOptions {
    skipValue?: boolean;
}

/**
 * Represents the result of a full validation of a value, array or schema.
 */
export class Processed<T> {
    constructor(copy?: ProcessedInput<T>) {
        Object.assign(this, copy);
    }

    /**
     * The parsed value, only set if no errors occured.
     */
    public value?: T;
    /**
     * A map with the results of nested objects. On a schema,
     * for each key with an error a key would be present in this map.
     */
    public nested?: { [key: string]: Processed<any>; };
    /**
     * A list of all errors occured for this value.
     */
    public errors?: string[];

    /**
     * Adds the errors to the list of errors, initializing them if necessary.
     *
     * @param errors The list of errors that occured.
     */
    public addErrors (...errors: string[]) {
        if (errors.length === 0) {
            return;
        }
        if (!this.errors) {
            this.errors = [...errors];
            return;
        }
        this.errors.push(...errors);
    }

    /**
     * Adds the validation result for a nested property to the map of nested properties.
     * Initializies the map if necessary.
     *
     * @param key The name of the property for which the validation result should be set.
     * @param nested The result of the validation for the given property.
     */
    public addNested (key: string | number, nested: Processed<any>) {
        if (!this.nested) { this.nested = { [key]: nested }; }
        this.nested[key] = nested;
    }

    /**
     * Will be `true` if any errors occured for this value or nested ones.
     * Recursively traverses all nested values.
     */
    public get hasErrors(): boolean {
        const { errors, nested } = this;
        const currentHasErrors = Boolean(errors && errors.length > 0);
        const nestedHasErrors: boolean = Boolean(nested && Object.keys(nested).reduce((result, key) => {
            return result || nested[key].hasErrors;
        }, false));
        return  currentHasErrors || nestedHasErrors;
    }

    /**
     * Merges the results (errors, value and nested) of another validation result with this one.
     * This will mutate this instance. This function will recursively traverse all nested results.
     *
     * @param other The other value to merge into this one.
     */
    public merge(other: Processed<T>, options?: MergeOptions) {
        if (typeof other === "undefined" || other === null) {
            return;
        }
        // Only merge errors if the other has any errors.
        if (typeof other.errors !== "undefined") {
            // Initialize our `errors` if it wasn't initialized previously.
            if (this.errors) {
                this.errors.push(...other.errors);
            } else {
                this.errors = [...other.errors];
            }
        }
        // If set, merge all nested values.
        if (typeof other.nested !== "undefined" && other.nested !== null) {
            Object.keys(other.nested).forEach(key => {
                if (typeof this.nested === "undefined" || typeof this.nested[key] === "undefined") {
                    this.addNested(key, other.nested[key]);
                    return;
                }
                // Merge nested values recursively.
                this.nested[key].merge(other.nested[key]);
            });
        }
        const skipValue = Boolean(options && options.skipValue);
        // Copy the value if our value is not set but the other value is set.
        if (typeof this.value === "undefined" && typeof other.value !== "undefined" && !skipValue) {
            this.value = other.value;
        }
    }
}
