import { ValidationStatus, mergeValidationStatus, combineValidationStatus } from "hyrest-mobx";

const allStatus = [
    ValidationStatus.IN_PROGRESS,
    ValidationStatus.VALID,
    ValidationStatus.INVALID,
    ValidationStatus.UNKNOWN,
];

allStatus.forEach(statusA => {
    allStatus.forEach(statusB => {
        test(`mergeValidationStatus(${statusA}, ${statusB})`, () => {
            expect(mergeValidationStatus(statusA, statusB)).toMatchSnapshot();
        });
    });
});

[
    [ValidationStatus.IN_PROGRESS, ValidationStatus.INVALID, ValidationStatus.INVALID],
    [ValidationStatus.VALID, ValidationStatus.INVALID, ValidationStatus.UNKNOWN],
    [ValidationStatus.IN_PROGRESS, ValidationStatus.INVALID, ValidationStatus.VALID, ValidationStatus.UNKNOWN],
    [],
].forEach(statusArray => {
    test(`combineValidationStatus(${statusArray.join(", ")})`, () => {
        expect(combineValidationStatus(statusArray)).toMatchSnapshot();
    });
});
