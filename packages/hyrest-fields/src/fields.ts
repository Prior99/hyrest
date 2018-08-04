import { Constructable } from "hyrest";

export type Field<TModel> = {
    [K in keyof TModel]?: {
        value: TModel[K];
    };
};

export function fields<TModel>(modelType: Constructable<TModel>): PropertyDecorator {
    return (target: Object, property: string | symbol): void => {
        const model = new modelType();
        Object.keys(model).reduce((result, ))
        const wrapper: Field<TModel> = {};
        Object.defineProperty(target, property, {
            writable: false,
            configurable: false,
            value: wrapper,
        });
    };
}
