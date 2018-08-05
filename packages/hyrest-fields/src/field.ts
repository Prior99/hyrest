import { PropertyMeta, getPropertyValidation, Constructable, populate, ValidationOptions, universal } from "hyrest";

export enum ValidationStatus {
    UNTOUCHED = "untouched",
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
    if (statusA === ValidationStatus.UNTOUCHED || statusB === ValidationStatus.UNTOUCHED) {
        return ValidationStatus.UNTOUCHED;
    }
    return ValidationStatus.VALID;

}

//TODO: Use processed?
export function combineValidationStatus(status: ValidationStatus[]) {
    return status.reduce((result, current) => mergeValidationStatus);
}

export type Fields<TModel, TContext> = {
    [K in keyof TModel]?: Field<TModel[K], TContext>;
};

export class Field<TModel, TContext> {
    public status = ValidationStatus.UNTOUCHED;
    private modelType: Constructable<TModel>;
    private validation?: ValidationOptions<TModel, TContext>;
    private fieldsMap: Fields<TModel, TContext>;
    private fields: Fields<TModel, TContext>;
    private model: TModel;
    private properties: PropertyMeta[];

    constructor(modelType: Constructable<TModel>, validation: ValidationOptions<TModel, TContext>) {
        this.validation = validation;
        this.modelType = modelType;
        this.properties = universal.propertiesForClass(this.modelType);
        this.fieldsMap = this.properties.reduce((result, { target, property, expectedType }) => {
            // Need to initialize the whole fields map with `undefined` to help frameworks such as MobX.
            result[property as keyof TModel] = undefined;
            return result;
        }, {} as Fields<TModel, TContext>);
        this.fields = this.properties.reduce((result, { target, property, expectedType }) => {
            const key = property as keyof TModel;
            // Create a getter on the `fields` property which will lazily initialize all `Field`s.
            Object.defineProperty(result, property, {
                get: () => {
                    if (this.fieldsMap[key] === undefined) {
                        this.fieldsMap[key] = new Field(expectedType, getPropertyValidation(target, property));
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
        return this.properties.length === 0;
    }

    public get valid(): boolean { return this.status === ValidationStatus.VALID; }
    public get invalid(): boolean { return this.status === ValidationStatus.INVALID; }
    public get inProgress(): boolean { return this.status === ValidationStatus.IN_PROGRESS; }
    public get untouched(): boolean { return this.status === ValidationStatus.UNTOUCHED; }

    public async update(newValue: TModel) {
        if (this.isManaged) {
            await Promise.all(Object.keys(newValue).map((key) => {
                return this.fieldsMap[key as keyof TModel].update(newValue[key as keyof TModel]);
            }));
            return;
        }
        this.model = newValue;
        if (this.validation.fullValidator) {
            this.status = ValidationStatus.IN_PROGRESS;
            const processed = await this.validation.fullValidator(newValue);
            this.status = processed.hasErrors ? ValidationStatus.INVALID : ValidationStatus.VALID;
        }
    }
}

export function fields<TModel>(modelType: Constructable<TModel>): PropertyDecorator {
    return (target: Object, property: string): void => {
        Object.defineProperty(target, property, {
            writable: false,
            configurable: false,
            value: new Field(modelType, getPropertyValidation(target, property)),
        });
    };
}
