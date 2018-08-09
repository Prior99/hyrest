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
import { ValidationStatus } from "./validation-status";
import { ContextFactory } from "./context-factory";
import { BaseField } from "./base-field";

export class FieldArray<TModel, TContext> extends Array<TModel> implements ReadonlyArray<TModel>, BaseField<TModel[]> {
    /**
     * The validation status for this field.
     */
    @observable public status = ValidationStatus.UNTOUCHED;

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
    ) {
        super();
        this.contextFactory = contextFactory;
        this.validation = validation;
        this.modelType = modelType;
    }

    // public get array(): FieldArray<TModel[0], TContext> {
    //     if (this._array) { return this._array; }
    //     if (!Array.isArray(this.model) && this.model !== null && typeof this.model !== "undefined") {
    //         throw new Error("Can't create a field array from a non-Array type.");
    //     }
    //     this._array = new FieldArray(this.model as any as any[]);
    // }
    public get value(): TModel[] {
        throw new Error("TODO");
    }

    @computed public get valid(): boolean { return this.status === ValidationStatus.VALID; }
    @computed public get invalid(): boolean { return this.status === ValidationStatus.INVALID; }
    @computed public get inProgress(): boolean { return this.status === ValidationStatus.IN_PROGRESS; }
    @computed public get untouched(): boolean { return this.status === ValidationStatus.UNTOUCHED; }

    @bind @action public async update(newValue: TModel[]) {
        throw new Error("TODO");
    }
}
