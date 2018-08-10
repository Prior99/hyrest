import { ValidationStatus } from "./validation-status";

export interface BaseField<TModel> {
    /**
     * The validation status for the current value.
     * Always held in synchronization with the value.
     */
    status: ValidationStatus;

    /**
     * The actual, unwrapped value for this field.
     * When called on a structure, this will create a real model.
     */
    value: TModel;

    /**
     * Whether the current value is valid.
     * Syntactic sugar for `status === ValidationStatus.VALID`.
     */
    valid: boolean;

    /**
     * Whether the current value is invalid.
     * Syntactic sugar for `status === ValidationStatus.INVALID`.
     */
    invalid: boolean;

    /**
     * Whether the validation for the current value is still in progress.
     * Syntactic sugar for `status === ValidationStatus.IN_PROGRESS`.
     */
    inProgress: boolean;

    /**
     * Whether the value has never been set before.
     * Syntactic sugar for `status === ValidationStatus.UNTOUCHED`.
     */
    untouched: boolean;

    /**
     * Can be called to update the value, for example when the user typed
     * something in a related field.
     *
     * When called on a structure, this will update all underlying fields
     * recursively.
     */
    update(newValue: TModel): Promise<void>;

    /**
     * Erase all values from this and potential nested fields.
     */
    reset(): Promise<void>;
}
