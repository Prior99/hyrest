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
import { ContextFactory } from "./context-factory";
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
        if (items) { this.fields.push(...items); }
    }

    public get value(): TModel[] {
        return this.map(field => field.value as TModel);
    }

    @computed public get valid(): boolean { return this.status === ValidationStatus.VALID; }
    @computed public get invalid(): boolean { return this.status === ValidationStatus.INVALID; }
    @computed public get inProgress(): boolean { return this.status === ValidationStatus.IN_PROGRESS; }
    @computed public get unknown(): boolean { return this.status === ValidationStatus.UNKNOWN; }

    @bind @action public async update(newValues: TModel[]) {
        const existingSlice = newValues.slice(0, this.length);
        await Promise.all(existingSlice.map((value, index) => (this.fields[index] as any).update(value)));
        const newSlice = newValues.slice(this.length, newValues.length);
        await this.add(...newSlice);
    }

    @bind @action public async add(...newValues: TModel[]): Promise<number> {
        const fields: Field<TModel, TContext>[] = await Promise.all(newValues.map(async value => {
            const field = createField(this.modelType, this.contextFactory, false, this.validation);
            await field.update(value);
            return field as Field<TModel, TContext>;
        }));
        return this.fields.push(...fields);
    }

    @bind @action public async reset() {
        this.fields = [];
    }

    private clone(items: Field<TModel, TContext>[]): FieldArray<TModel, TContext> {
        return new FieldArray<TModel, TContext>(
            this.modelType,
            this.contextFactory,
            this.validation,
            items,
        );
    }

    public get length() {
        return this.fields.length;
    }

    public concat(other: FieldArray<TModel, TContext>): FieldArray<TModel, TContext> {
        return this.clone([...this.fields, ...other.fields]);
    }

    public slice(start?: number, end?: number): FieldArray<TModel, TContext> {
        return this.clone(this.fields.slice(start, end));
    }

    public indexOf(searchElement: Field<TModel, TContext>, fromIndex?: number): number {
        return this.fields.indexOf(searchElement, fromIndex);
    }

    public lastIndexOf(searchElement: Field<TModel, TContext>, fromIndex?: number): number {
        return this.fields.lastIndexOf(searchElement, fromIndex);
    }

    public every(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => boolean,
    ): boolean {
        return this.fields.every((value, index) => fn(value, index, this));
    }

    public some(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => boolean,
    ): boolean {
        return this.fields.some((value, index) => fn(value, index, this));
    }

    public forEach(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => void,
    ): void {
        this.fields.forEach((value, index) => fn(value, index, this));
    }

    public map<U>(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => U,
    ): U[] {
        return this.fields.map((value, index) => fn(value, index, this));
    }

    public filter(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => any,
    ): FieldArray<TModel, TContext> {
        return this.clone(this.fields.filter((value, index) => fn(value, index, this)));
    }

    public reduce<U>(
        fn: (result: U, value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => U,
        initialValue?: U,
    ): U {
        return this.fields.reduce((result, value, index) => fn(result, value, index, this), initialValue);
    }

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

    public find(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => boolean,
    ): Field<TModel, TContext> {
        return this.fields.find((value, index) => fn(value, index, this));
    }

    public findIndex(
        fn: (value: Field<TModel, TContext>, index: number, array: FieldArray<TModel, TContext>) => boolean,
    ): number {
        return this.fields.findIndex((value, index) => fn(value, index, this));
    }

    public at(index: number): Field<TModel, TContext> {
        return this.fields[index];
    }

    public valueAt(index: number): TModel {
        return this.fields[index].value as TModel;
    }

    @computed public get status(): ValidationStatus {
        return combineValidationStatus(this.fields.map(field => field.status));
    }
}
