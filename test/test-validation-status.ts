import { ValidationStatus, mergeValidationStatus, combineValidationStatus } from "hyrest-mobx";

const allStatus = [
    ValidationStatus.IN_PROGRESS,
    ValidationStatus.VALID,
    ValidationStatus.INVALID,
    ValidationStatus.UNTOUCHED,
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
    [ValidationStatus.VALID, ValidationStatus.INVALID, ValidationStatus.UNTOUCHED],
    [ValidationStatus.IN_PROGRESS, ValidationStatus.INVALID, ValidationStatus.VALID, ValidationStatus.UNTOUCHED],
    [],
].forEach(statusArray => {
    test(`combineValidationStatus(${statusArray.join(", ")})`, () => {
        expect(combineValidationStatus(statusArray)).toMatchSnapshot();
    });
});
