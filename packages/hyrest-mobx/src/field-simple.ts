import { bind } from "bind-decorator";
import * as invariant from "invariant";
import {
    PropertyMeta,
    getPropertyValidation,
    Constructable,
    populate,
    ValidationOptions,
    universal,
    getSpecifiedType,
} from "hyrest";
import { observable, computed, action } from "mobx";
import { ValidationStatus } from "./validation-status";
import { ContextFactory } from "./context-factory";
import { BaseField } from "./base-field";
import { Fields } from "./fields";
import { createField } from "./field";
import { FieldArray } from "./field-array";

export class FieldSimple<TModel, TContext = any> implements BaseField<TModel> {
    /**
     * The validation status for this field.
     */
    @observable public status = ValidationStatus.UNTOUCHED;

    /**
     * Nested fields of this field.
     */
    public nested: Fields<TModel, TContext>;

    /**
     * The `nested` property on this class is by default initialized using `undefined` for
     * every property to allow for lazy initialization of deeply nested structures.
     * This is an internal map for keeping the real values.
     */
    private _nested: Fields<TModel, TContext>;

    /**
     * The runtime-accessible type of the model. Specified using `@specify` or using reflection.
     */
    private modelType: Constructable<TModel>;

    /**
     * A validator if the developer used a `@is` decorator on the class.
     */
    private validation?: ValidationOptions<TModel, TContext>;

    /**
     * The actual value for this field if it doesn't have sub-fields.
     */
    @observable private model: TModel = undefined;

    /**
     * Property metadata gathered from the `universal` scope about the `modelType`.
     * Cached and initialized from the constructor.
     */
    private properties: PropertyMeta[];

    /**
     * The context factory provided by the `@hasFields` decorator, creating a context handed
     * down to the validator for the `.validateCtx` method.
     */
    private contextFactory: ContextFactory<TContext>;

    constructor(
        modelType: Constructable<TModel>,
        contextFactory: ContextFactory<TContext>,
        validation?: ValidationOptions<TModel, TContext>,
    ) {
        // Copy all arguments that should be stored.
        this.contextFactory = contextFactory;
        this.validation = validation;
        this.modelType = modelType;
        // Gather and cache all property metadata from the universal scope.
        this.properties = universal.propertiesForClass(this.modelType);
        this.initializeNested();
    }

    private initializeNested() {
        // Initialize the map of real, underlying values for each nested field to contain an `undefined`
        // value for each key. This is necessary for Mobx, as the addition of new keys later on will not trigger
        // the observable.
        this._nested = this.properties.reduce((result, { target, property, expectedType }) => {
            // Need to initialize the whole fields map with `undefined` to help frameworks such as MobX.
            result[property as keyof TModel] = undefined;
            return result;
        }, {} as Fields<TModel, TContext>);
        // Create the outfacing `nested` property: Create a getter for each property which lazily initializes
        // and caches the real value in `_nested`.
        this.nested = this.properties.reduce((result, propertyMeta) => {
            // Create a getter on the `fields` property which will lazily initialize all `Field`s.
            Object.defineProperty(result, propertyMeta.property, {
                get: () => this.getNested(propertyMeta),
                enumerable: true,
            });
            return result;
        }, {} as Fields<TModel, TContext>);
    }

    private getNested({ property, expectedType, target }: PropertyMeta) {
        const key = property as keyof TModel;
        if (this._nested[key] !== undefined) { return this._nested[key]; }
        const nestedValidation = getPropertyValidation(target, property);
        // The cast to `any` are neccessary as Typescript cannot deal with this
        // kind of types. See https://github.com/Microsoft/TypeScript/issues/22628 (for example).
        if (expectedType === Array) {
            const arrayType = getSpecifiedType(target, property).property;
            if (!arrayType) {
                throw new Error(
                    "Accessing a property of type Array without being decorated by  @specify. " +
                    `Check property "${property as string}" on class "${target.constructor.name}".`,
                );
            }
            this._nested[key] =
                createField(
                    arrayType() as Constructable<TModel[keyof TModel]>,
                    this.contextFactory,
                    true,
                    nestedValidation,
                ) as any;
        } else {
            this._nested[key] =
                createField(
                    expectedType,
                    this.contextFactory,
                    false,
                    nestedValidation,
                ) as any;
        }
        return this._nested[key];
    }

    /**
     * Determines whether this is a managed property.
     * If the developer defined any validation decorators (`@is`) on this class, it is managed and therefore
     * for example a new `Field` instance needs to be created. Also, no value will be managed in this instance.
     */
    private get isManaged() {
        return this.properties.length !== 0;
    }

    public get value(): TModel {
        if (this.isManaged) {
            const obj = Object.keys(this._nested).reduce((result: TModel, key) => {
                const modelKey = key as keyof TModel;
                const field = this._nested[modelKey];
                if (!field) { return result; }
                invariant(
                    field instanceof FieldSimple || field instanceof FieldArray,
                    "Found an invalid wrapped field value.",
                );
                if (field instanceof FieldSimple) {
                    result[modelKey] = field.value;
                } else {
                    result[modelKey] = field.value as TModel[keyof TModel];
                }
                return result;
            }, {});
            return populate(this.modelType, obj);
        }
        return this.model;
    }

    @computed public get valid(): boolean { return this.status === ValidationStatus.VALID; }
    @computed public get invalid(): boolean { return this.status === ValidationStatus.INVALID; }
    @computed public get inProgress(): boolean { return this.status === ValidationStatus.IN_PROGRESS; }
    @computed public get untouched(): boolean { return this.status === ValidationStatus.UNTOUCHED; }

    @bind @action public async update(newValue: TModel) {
        if (this.isManaged) {
            await Promise.all(Object.keys(newValue).map(key => {
                const modelKey = key as keyof TModel;
                const field = this.nested[modelKey];
                if (!Object.keys(this.nested).includes(key)) { return; }
                invariant(
                    field instanceof FieldSimple || field instanceof FieldArray,
                    "Found an invalid wrapped field value.",
                );
                if (field instanceof FieldSimple) {
                    return field.update(newValue[modelKey]);
                }
                if (field instanceof FieldArray) {
                    return field.update(newValue[modelKey] as TModel[keyof TModel] & any[]);
                }
            }));
            return;
        }
        this.model = newValue;
        if (this.validation.fullValidator) {
            this.status = ValidationStatus.IN_PROGRESS;
            const processed = await this.validation.fullValidator(
                newValue,
                { context: this.contextFactory() },
            );
            this.status = processed.hasErrors ? ValidationStatus.INVALID : ValidationStatus.VALID;
        }
    }

    @bind @action public async reset() {
        this.initializeNested();
        this.status = ValidationStatus.UNTOUCHED;
    }
}
