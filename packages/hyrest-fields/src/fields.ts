import { Constructable, populate, FullValidator } from "hyrest";

export enum ValidationStatus {
    UNTOUCHED = "untouched",
    VALID = "valid",
    IN_PROGRESS = "in progress",
    INVALID = "invalid",
}

export class Field<T, TContext> {
    public status = ValidationStatus.UNTOUCHED;
    public value: T;
    private validator: FullValidator<T, TContext>;

    constructor(value: T, validator: FullValidator<T, TContext>) {
        this.value = value;
        this.validator = validator;
    }

    public get valid(): boolean { return this.status === ValidationStatus.VALID; }
    public get invalid(): boolean { return this.status === ValidationStatus.INVALID; }
    public get inProgress(): boolean { return this.status === ValidationStatus.IN_PROGRESS; }
    public get untouched(): boolean { return this.status === ValidationStatus.UNTOUCHED; }

    public async update(newValue: T) {
        this.value = newValue;
        this.status = ValidationStatus.IN_PROGRESS;
        const processed = await this.validator(this.value);
        this.status = processed.hasErrors ? ValidationStatus.INVALID : ValidationStatus.VALID;
    }
}

export type FieldsMeta<TModel, TContext> = {
    [K in keyof TModel]?: Field<TModel[K], TContext>;
};

export class Fields<TModel, TContext>  {
    public model: TModel;
    public fields: FieldsMeta<TModel, TContext>;

    constructor (modelType: Constructable<TModel>) {
        this.model = populate(modelType, {});
    }
}

export function fields<TModel>(modelType: Constructable<TModel>): PropertyDecorator {
    return (target: Object, property: string | symbol): void => {
        Object.defineProperty(target, property, {
            writable: false,
            configurable: false,
            value: new Fields(modelType),
        });
    };
}
