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
import { ValidationStatus, combineValidationStatus } from "./validation-status";
import { ContextFactory } from "./context-factory";
import { BaseField } from "./base-field";
import { Fields } from "./fields";
import { createField } from "./field";
import { FieldArray } from "./field-array";
import { ReactEvent } from "./react-types";

export class FieldSimple<TModel, TContext = any> implements BaseField<TModel> {
    @observable private _errors: string[] = [];
    /**
     * The validation status for this field.
     */
    @observable private _status = ValidationStatus.UNKNOWN;

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

    /**
     * Creates the internal `_nested` map of nested values.
     */
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

    /**
     * Returns the nested value for the provided property metadata.
     * Is guaranteed to always return a `Field` if the provided property existed on the wrapped type.
     *
     * If no `Field` existed previously, a new one is created and cached in `_nested`. Otherwise the
     * cached value is returned.
     *
     * @param propertyMeta The property metadata for which the nested `Field` should be returned.
     *     Should be generated by `getPropertyMetadata`.
     *
     * @return The nested `Field` which was cached, a newly created one or `undefined` if
     *     an unknown property was specified.
     */
    private getNested(propertyMeta: PropertyMeta) {
        const { property, expectedType, target } = propertyMeta;
        const key = property as keyof TModel;
        if (this._nested[key] !== undefined) { return this._nested[key]; }
        const nestedValidation = getPropertyValidation(target, property);
        // The cast to `any` are neccessary as Typescript cannot deal with this
        // kind of types. See https://github.com/Microsoft/TypeScript/issues/22628 (for example).
        if (expectedType === Array) {
            // If the nested field was an array, use `@specify` metadata to determine the real type.
            const arrayType = getSpecifiedType(target, property).property;
            // If the developer forgot to use `@specify` (should be rather hard as decorators like `@is` already
            // throw an error when doing so), throw an error.
            if (!arrayType) {
                throw new Error(
                    "Accessing a property of type Array without being decorated by  @specify. " +
                    `Check property "${property as string}" on class "${target.constructor.name}".`,
                );
            }
            // Initialize the cache with a new `FieldArray`.
            this._nested[key] =
                createField(
                    arrayType() as Constructable<TModel[keyof TModel]>,
                    this.contextFactory,
                    true,
                    nestedValidation,
                ) as any;
        } else {
            // Initialize the cache with a new `FieldSimple`.
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

    /**
     * The actual, unwrapped value for this field.
     * When called on a structure, this will create a real model.
     */
    public get value(): TModel {
        // Check whether this is a structure or a primitive value.
        // Primitive values can also be complex structures which have no decorators making the structure
        // visible to hyrest-mobx.
        if (this.isManaged) {
            // Iterate over all keys of the wrapped structure (by using the cache which is initialized with `undefined`
            // for all existing properties) and create a new object from it.
            const obj = Object.keys(this._nested).reduce((result: TModel, key) => {
                // Shorthand for avoiding to write `key as keyof TModel` all the time.
                const modelKey = key as keyof TModel;
                // Retrieve an existing field if the cache was defined for this property. If none existed, don't
                // create the property key on the returned structure.
                const field = this._nested[modelKey];
                if (!field) { return result; }
                // Make sure the wrapped field is of a known type.
                invariant(
                    field instanceof FieldSimple || field instanceof FieldArray,
                    "Found an invalid wrapped field value.",
                );
                // Recursively call `.value` on the nested `FieldSimple` or `FieldArray`
                // and store the value in the created structure which is to be returned.
                if (field instanceof FieldSimple) {
                    result[modelKey] = field.value;
                } else {
                    result[modelKey] = field.value as TModel[keyof TModel];
                }
                return result;
            }, {});
            // Call `populate` on the structure generated above to make it a real instance of the specified type.
            return populate(this.modelType, obj);
        }
        // If this is not a complex structure and not visible to hyrest-mobx, simply return the value stored in `model`.
        return this.model;
    }

    /**
     * The actual, unwrapped value for this field.
     * When called on a structure, this will create a real model.
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
     * Can be called to update the value, for example when the user typed
     * something in a related field.
     *
     * When called on a structure, this will update all underlying fields
     * recursively.
     */
    @bind @action public async update(newValue: TModel) {
        // If this is a complex structure, recursively update all nested `Field`s.
        if (this.isManaged) {
            await Promise.all(Object.keys(newValue).map(key => {
                // Shorthand for avoiding to write `key as keyof TModel` all the time.
                const modelKey = key as keyof TModel;
                // If no `Field` existed with the specified key, it must be foreign and unknown to the type wrapped
                // by `FieldSimple`. Ignore it.
                if (!Object.keys(this.nested).includes(key)) { return; }
                const field = this.nested[modelKey];
                // Make sure the wrapped field is of a known type.
                invariant(
                    field instanceof FieldSimple || field instanceof FieldArray,
                    "Found an invalid wrapped field value.",
                );
                // Recursively call `.update` on the nested `FieldSimple` or `FieldArray`.
                if (field instanceof FieldSimple) {
                    return field.update(newValue[modelKey]);
                }
                /* istanbul ignore else */
                if (field instanceof FieldArray) {
                    return field.update(newValue[modelKey] as TModel[keyof TModel] & any[]);
                }
            }));
            return;
        }
        // If this was a primitive value, simply replace `model` with the new value and execute the validation.
        this.model = newValue;
        if (this.validation.fullValidator) {
            // Set the validation to `IN_PROGRESS` while the asynchroneous validation is executing.
            this._status = ValidationStatus.IN_PROGRESS;
            const processed = await this.validation.fullValidator(
                newValue,
                { context: this.contextFactory() },
            );
            // Now set the real status as returned by the validation.
            this._status = processed.hasErrors ? ValidationStatus.INVALID : ValidationStatus.VALID;
            this._errors = processed.errors || [];
        }
    }

    /**
     * Erase all values from this and potential nested fields.
     */
    @bind @action public async reset() {
        this.initializeNested();
        this._status = ValidationStatus.UNKNOWN;
    }

    /**
     * The validation status for the current value.
     * Always held in synchronization with the value.
     */
    @computed public get status(): ValidationStatus {
        // If this is a complex structure, return a status by combining all nested `Field`s status.
        if (this.isManaged) {
            const statusArray: ValidationStatus[] = Object.keys(this._nested)
                .map(key => {
                    const field = this._nested[key as keyof TModel];
                    if (typeof field === "undefined") { return ValidationStatus.UNKNOWN; }
                    return field.status;
                });
            return combineValidationStatus(statusArray);
        }
        // Simply return the cached status from the last call to `update` if this `Field` is wrapping primitive value.
        return this._status;
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
        if (this.isManaged) {
            return Object.keys(this._nested)
                .reduce((result, key) => {
                    const field = this._nested[key as keyof TModel];
                    if (typeof field === "undefined") { return result; }
                    return [ ...result, ...field.errors ];
                }, []);
        }
        return this._errors;
    }

    public get reactCheckbox() {
        const fieldSimple = this;
        return {
            onChange ({ target }: ReactEvent) {
                if (target.type !== "checkbox") {
                    console.warn(`"Field.reactCheckbox" received an event with a target of type "${target.type}".`);
                    return;
                }
                fieldSimple.update(target.checked as any);
                return;
            },
            get checked () {
                if (typeof fieldSimple.value === "undefined") { return false; }
                return fieldSimple.value;
            },
        };
    }

    public get reactInput() {
        const fieldSimple = this;
        return {
            onChange ({ target }: ReactEvent) {
                switch (target.type) {
                    case "checkbox":
                        console.warn(
                            `"Field.reactInput" used with an inpput of type "${target.type}". ` +
                            `Use "Field.reactCheckbox" instead.`,
                        );
                        fieldSimple.update(target.checked as any);
                        return;
                    case "date":
                    case "datetime-local":
                        fieldSimple.update(new Date(target.value as string) as any);
                        return;
                    default:
                        fieldSimple.update(target.value as any);
                        return;
                }
            },
            get value () {
                if (typeof fieldSimple.value === "object" && fieldSimple.value.constructor === Date) {
                    return (fieldSimple.value as any as Date).toISOString().split("T")[0];
                }
                if (typeof fieldSimple.value === "undefined") { return ""; }
                return fieldSimple.value as any;
            },
        };
    }
}
