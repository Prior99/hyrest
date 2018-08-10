export enum ValidationStatus {
    UNKNOWN = "unknown",
    VALID = "valid",
    IN_PROGRESS = "in progress",
    INVALID = "invalid",
}

export function mergeValidationStatus(statusA: ValidationStatus, statusB: ValidationStatus): ValidationStatus {
    if (statusA === ValidationStatus.IN_PROGRESS || statusB === ValidationStatus.IN_PROGRESS) {
        return ValidationStatus.IN_PROGRESS;
    }
    if (statusA === ValidationStatus.INVALID || statusB === ValidationStatus.INVALID) {
        return ValidationStatus.INVALID;
    }
    if (statusA === ValidationStatus.VALID || statusB === ValidationStatus.VALID) {
        return ValidationStatus.VALID;
    }
    return ValidationStatus.UNKNOWN;

}

export function combineValidationStatus(status: ValidationStatus[]): ValidationStatus {
    if (status.length === 0) { return ValidationStatus.UNKNOWN; }
    return status.reduce((result, current) => mergeValidationStatus(result, current));
}
