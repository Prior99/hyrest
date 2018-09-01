import { bind } from "bind-decorator";
import {
    PropertyMeta,
    getPropertyValidation,
    Constructable,
    populate,
    ValidationOptions,
    universal,
} from "hyrest";
import { observable, computed, action } from "mobx";
import { ValidationStatus, combineValidationStatus } from "./validation-status";
import { ContextFactory } from "../types";
import { BaseField } from "./base-field";
import { Field, createField } from "./field";

export class FieldArray<TModel, TContext> implements BaseField<TModel[]> {
    /**
     * The actual fields.
     */
    @observable private fields: Field<TModel, TContext>[] = [];

    /**
     * A validator if the developer used a `@is` decorator on the class.
     */
    private validation?: ValidationOptions<TModel, TContext>;

    /**
     * The context factory provided by the `@hasFields` decorator, creating a context handed
     * down to the validator for the `.validateCtx` method.
     */
    private contextFactory: ContextFactory<TContext>;

    /**
     * The runtime-accessible type of the model. Specified using `@specify` or using reflection.
     */
    private modelType: Constructable<TModel>;

    constructor (
        modelType: Constructable<TModel>,
        contextFactory: ContextFactory<TContext>,
        validation?: ValidationOptions<TModel, TContext>,
        items?: Field<TModel, TContext>[],
    ) {
        this.contextFactory = contextFactory;
        this.validation = validation;
        this.modelType = modelType;
        // Initialize fields if initial fields are provided.
        if (items) { this.fields.push(...items); }
    }

    /**
     * The actual, unwrapped value for this field. Will return an array of wrapped values.
     */
    public get value(): TModel[] {
        return this.map(field => field.value as TModel);
    }

    /**
     * Whether the current value is valid.
     * Syntactic sugar for `status === ValidationStatus.VALID`.
     */
    @computed public get valid(): boolean { return this.status === ValidationStatus.VALID; }

    /**
     * Whether the current value is invalid.
     * Syntactic sugar for `status === ValidationStatus.INVALID`.
     */
    @computed public get invalid(): boolean { return this.status === ValidationStatus.INVALID; }

    /**
     * Whether the validation for the current value is still in progress.
     * Syntactic sugar for `status === ValidationStatus.IN_PROGRESS`.
     */
    @computed public get inProgress(): boolean { return this.status === ValidationStatus.IN_PROGRESS; }

    /**
     * Whether the value has never been set before.
     * Syntactic sugar for `status === ValidationStatus.UNKNOWN`.
     */
    @computed public get unknown(): boolean { return this.status === ValidationStatus.UNKNOWN; }

    /**
     * Can be called to update all wrapped values.
     * Will updated all contained fields. If the provided array is longer than the wrapped array
     * (more elements are provided than known), new fields are created.
     *
     * @param newValues Array of values to update or add.
     */
    @bind @action public async update(newValues: TModel[]) {
        // Find the part of the array which matches with existing values ...
        const existingSlice = newValues.slice(0, this.length);
        // ... and recursively update them.
        await Promise.all(existingSlice.map((value, index) => (this.fields[index] as any).update(value)));
        // Find the part of the array which exceed the current length ...
        const newSlice = newValues.slice(this.length, newValues.length);
        // ... and add them to the array, wrapping them.
        await this.add(...newSlice);
    }

    /**
     * Add new values to the array. Wrap them in `Field`.
     *
     * @param newValues New values to wrap and add.
     *
     * @return The new number of wrapped values.
     */
    @bind @action public async add(...newValues: TModel[]): Promise<number> {
        // Wrap all new values in `Field`s and initialize the fields with them. Perform validation.
        const fields: Field<TModel, TContext>[] = await Promise.all(newValues.map(async value => {
            const field = createField(this.modelType, this.contextFactory, false, this.validation);
            await field.update(value);
            return field as Field<TModel, TContext>;
        }));
        // Store all wrapped fields.
        return this.fields.push(...fields);
    }

    /**
     * Reset all values. Reinitialize with an empty array.
     */
    @bind @action public async reset() {
        this.fields = [];
    }

    /**
     * Clone this instance with other wrapped fields.
     *
     * @param items New wrapped fields to be wrapped by the new FieldArray instance.
     *
     * @return The new FieldArray instance.
     */
    private clone(items: Field<TModel, TContext>[]): FieldArray<TModel, TContext> {
        return new FieldArray<TModel, TContext>(
            this.modelType,
            this.contextFactory,
            this.validation,
            items,
        );
    }

    /**
     * Gets sets the length of the array. Equal to `Array.length`.
     */
    public get length() {
        return this.fields.length;
    }

    /**
     * Combines two `FieldArray`s and returns a new one.
     *
     * @param other This and the `other` `FieldArray`s will be merged into a new `FieldArray`.
     *
     * @return Newly created `FieldArray`.
     */
    public concat(other: FieldArray<TModel, TContext>): FieldArray<TModel, TContext> {
        return this.clone([...this.fields, ...other.fields]);
    }

    /**
     * Returns a section of the wrapped fields as a new `FieldArray`.
     *
     * @param start The beginning of the specified portion of the array.
     * @param end The end of the specified portion of the array.
     *
     * @return The new `FieldArray`, containing the specified section.
     */
    public slice(start?: number, end?: number): FieldArray<TModel, TContext> {
        return this.clone(this.fields.slice(start, end));
    }

    /**
     * Returns the index of the first occurrence of a `Field` in the array.
     *
     * @param searchElement The `Field` to locate in the array.
     * @param fromIndex An optional array index at which to begin the search.
     *
     * @return The index of the specified `Field` or `-1` if none could be found.
     */
    public indexOf(searchElement: Field<TModel, TContext>, fromIndex?: number): number {
        return this.fields.indexOf(searchElement, fromIndex);
    }

    /**
     * Returns the index of the last occurrence of a `Field` in the array.
     *
     * @param searchElement The `Field` to locate in the array.
     * @param fromIndex An optional array index at which to begin the search.
     *
     * @return The index of the specified `Field` or `-1` if none could be found.
     */
    public lastIndexOf(searchElement: Field<TModel, TContext>, fromIndex?: number): number {
        return this.fields.lastIndexOf(searchElement, fromIndex);
    }

    /**
     * Determines whether all the `Field`s of this `FieldArray` satisfy the specified test.
     *
     * @param fn A test function. Called for every `Field`. Should return `true` for every element for the test to pass.
     *
     * @return Will return `true` if all function calls returned `true` and `false` otherwise.
     */
    public every(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => boolean,
    ): boolean {
        return this.fields.every((value, index) => fn(value, index, this));
    }

    /**
     * Determines whether at least one of the `Field`s of this `FieldArray` satisfies the specified test.
     *
     * @param fn A test function. Called for every `Field`. Should return `true` for one element for the test to pass.
     *
     * @return Will return `true` if one of the function calls returned `true` and `false` otherwise.
     */
    public some(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => boolean,
    ): boolean {
        return this.fields.some((value, index) => fn(value, index, this));
    }

    /**
     * Will call the provided function for every wrapped `Field`.
     *
     * @param fn A function which will be called for every wrapped `Field` in this `FieldArray`.
     */
    public forEach(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => void,
    ): void {
        this.fields.forEach((value, index) => fn(value, index, this));
    }

    /**
     * Calls the specified function for every wrapped `Field` and will return a new array created by
     * using the return values of all calls.
     *
     * @param fn A function called for every `Field` wrapped in this `FieldArray`.
     *
     * @return An array created by concattenating all return values of the calls to the `fn` parameter.
     */
    public map<U>(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => U,
    ): U[] {
        return this.fields.map((value, index) => fn(value, index, this));
    }

    /**
     * Will return a new `FieldArray` with only those fields left which fullfilled the provided condition.
     *
     * @param fn A function which should return `true` for all `Field`s that should be kept.
     *
     * @return A new `FieldArray`, keeping all fields for which the condition returned `true`.
     */
    public filter(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => any,
    ): FieldArray<TModel, TContext> {
        return this.clone(this.fields.filter((value, index) => fn(value, index, this)));
    }

    /**
     * Calls the specified function for all contained `Field`s and will create a new value of type `U`
     * by using the return value of all function calls.
     *
     * @param fn The function to call for all `Field`s.
     * @param initialValue An optional initial value to initialize the returned value with.
     *
     * @return The returned value from the last call to `fn`.
     */
    public reduce<U>(
        fn: (result: U, value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => U,
        initialValue?: U,
    ): U {
        return this.fields.reduce((result, value, index) => fn(result, value, index, this), initialValue);
    }

    /**
     * Calls the specified function for all contained `Field`s and will create a new value of type `U`
     * by using the return value of all function calls. Reversed version of `reduce`.
     *
     * @param fn The function to call for all `Field`s.
     * @param initialValue An optional initial value to initialize the returned value with.
     *
     * @return The returned value from the last call to `fn`.
     */
    public reduceRight<U>(
        fn: (
            result: U,
            value: Field<TModel, TContext>,
            index: number,
            array: FieldArray<TModel, TContext>,
        ) => U,
        initialValue?: U,
    ): U {
        return this.fields.reduceRight((result, value, index) => fn(result, value, index, this), initialValue);
    }

    /**
     * Will call the provided function on all wrapped `Field`s and return the first one which it returned `true` for.
     *
     * @param fn A function called for each wrapped `Field`.
     *
     * @return The first wrapped `Field` for which `fn` returned `true`.
     */
    public find(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => boolean,
    ): Field<TModel, TContext> {
        return this.fields.find((value, index) => fn(value, index, this));
    }

    /**
     * Will call the provided function on all wrapped `Field`s and return the index of the first one
     * which it returned `true` for.
     *
     * @param fn A function called for each wrapped `Field`.
     *
     * @return The index of the first wrapped `Field` for which `fn` returned `true`.
     */
    public findIndex(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => boolean,
    ): number {
        return this.fields.findIndex((value, index) => fn(value, index, this));
    }

    /**
     * Returns the wrapped `Field` on index `index`. Will return `undefined` if no field existed at that index.
     *
     * @param index The index on which the `Field` should be retrieved.
     *
     * @return The `Field` at index `index` or `undefined` if no such index existed.
     */
    public at(index: number): Field<TModel, TContext> {
        return this.fields[index];
    }
    /**
     * Returns the value of the wrapped `Field` on index `index`.
     * Will return `undefined` if no field existed at that index.
     * Syntactic sugar for `FieldArray.at(index).value`.
     *
     * @param index The index on which the `Field`s value should be retrieved.
     *
     * @return The `Field` at index `index` or `undefined` if no such index existed.
     */
    public valueAt(index: number): TModel {
        return this.fields[index].value as TModel;
    }

    /**
     * The combined validation status of all wrapped `Field`s.
     */
    @computed public get status(): ValidationStatus {
        return combineValidationStatus(this.fields.map(field => field.status));
    }

    /**
     * One sample error from the `errors` property. The first error from the array.
     */
    @computed public get error(): string {
        return this.errors.length > 0 ? this.errors[0] : undefined;
    }

    /**
     * All validation errors of this or nested fields.
     */
    @computed public get errors(): string[] {
        return this.fields.reduce((result, subField) => {
            return [ ...result, ...subField.errors ];
        }, []);
    }
}
