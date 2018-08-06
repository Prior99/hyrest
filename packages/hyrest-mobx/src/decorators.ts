import "reflect-metadata";
import {
    PropertyMeta,
    getPropertyValidation,
    Constructable,
    populate,
    ValidationOptions,
    universal,
} from "hyrest";
import { ValidationStatus } from "./validation-status";
import { ContextFactory } from "./types";
import { Field } from "./field";

export interface FieldsMeta {
    fieldProperties: {
        property: string,
        modelType: any,
    }[];
}

export function getFieldsMeta(target: Object): FieldsMeta {
    const fieldsMeta = Reflect.getMetadata("fields", target);
    if (fieldsMeta) { return fieldsMeta; }
    const newFields: FieldsMeta = {
        fieldProperties: [],
    };
    Reflect.defineMetadata("fields", newFields, target);
    return newFields;
}

export function hasFields<TContext>(
    contextFactory: ContextFactory<TContext>,
    fieldType: Function = Field,
): ClassDecorator {
    const decorator = function <T extends Function>(target: T): T {
        const constructor = function OverloadedConstructor(this: any, ...args: any[]): any {
            const instance = new (target as any)(...args);
            const { fieldProperties } = getFieldsMeta(target);
            fieldProperties.forEach(({ property, modelType }) => {
                (instance as any)[property] = new Field(modelType, contextFactory);
            });
            return instance;
        };
        try {
            Object.defineProperty(constructor, "name", {
                get () { return target.name; },
            });
        } catch (err) {
            // tslint:disable-line
        }
        /* istanbul ignore else */
        if (typeof Object.setPrototypeOf !== "undefined") {
            Object.setPrototypeOf(constructor, target);
        } else {
            (constructor as any).__proto__ = target;
        }
        constructor.prototype = target.prototype;
        return constructor as any;
    };
    return decorator;
}

export function field<TModel, TContext>(modelType: Constructable<TModel>): PropertyDecorator {
    return (target: Object, property: string): void => {
        const fieldsMeta = getFieldsMeta(target.constructor);
        fieldsMeta.fieldProperties.push({ property, modelType });
    };
}
