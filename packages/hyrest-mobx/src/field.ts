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
import { ContextFactory } from "./types";

export type Fields<TModel, TContext> = {
    [K in keyof TModel]?: Field<TModel[K], TContext>;
};

export class Field<TModel, TContext = any> {
    @observable public status = ValidationStatus.UNTOUCHED;
    public nested: Fields<TModel, TContext>;

    private modelType: Constructable<TModel>;
    private validation?: ValidationOptions<TModel, TContext>;
    private fieldsMap: Fields<TModel, TContext>;
    @observable private model: TModel = undefined;
    private properties: PropertyMeta[];
    private contextFactory: ContextFactory<TContext>;

    constructor(
        modelType: Constructable<TModel>,
        contextFactory: ContextFactory<TContext>,
        validation?: ValidationOptions<TModel, TContext>,
    ) {
        this.contextFactory = contextFactory;
        this.validation = validation;
        this.modelType = modelType;
        this.properties = universal.propertiesForClass(this.modelType);
        this.fieldsMap = this.properties.reduce((result, { target, property, expectedType }) => {
            // Need to initialize the whole fields map with `undefined` to help frameworks such as MobX.
            result[property as keyof TModel] = undefined;
            return result;
        }, {} as Fields<TModel, TContext>);
        this.nested = this.properties.reduce((result, { target, property, expectedType }) => {
            const key = property as keyof TModel;
            // Create a getter on the `fields` property which will lazily initialize all `Field`s.
            Object.defineProperty(result, property, {
                get: () => {
                    if (this.fieldsMap[key] === undefined) {
                        this.fieldsMap[key] = new Field(
                            expectedType,
                            this.contextFactory,
                            getPropertyValidation(target, property),
                        );
                    }
                    return this.fieldsMap[key];
                },
                enumerable: true,
            });
            return result;
        }, {} as Fields<TModel, TContext>);
    }

    public get value(): TModel {
        if (this.isManaged) {
            const obj = Object.keys(this.fieldsMap).reduce((result: TModel, key) => {
                result[key as keyof TModel] = this.fieldsMap[key as keyof TModel].value;
                return result;
            }, {});
            return populate(this.modelType, obj);
        }
        return this.model;
    }

    /**
     * Determines whether this is a managed property.
     * If the developer defined any validation decorators (`@is`) on this class, it is managed and therefore
     * for example a new `Field` instance needs to be created. Also, no value will be managed in this instance.
     */
    private get isManaged() {
        return this.properties.length !== 0;
    }

    @computed public get valid(): boolean { return this.status === ValidationStatus.VALID; }
    @computed public get invalid(): boolean { return this.status === ValidationStatus.INVALID; }
    @computed public get inProgress(): boolean { return this.status === ValidationStatus.IN_PROGRESS; }
    @computed public get untouched(): boolean { return this.status === ValidationStatus.UNTOUCHED; }

    @bind @action public async update(newValue: TModel) {
        if (this.isManaged) {
            await Promise.all(Object.keys(newValue).map((key) => {
                return this.fieldsMap[key as keyof TModel].update(newValue[key as keyof TModel]);
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
}
