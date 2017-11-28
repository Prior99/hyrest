import "reflect-metadata";
import * as uuid from "uuid";

export interface PropertyMeta {
    target: Object;
    property: string;
}

export class Scope {
    public identifier: string;

    private included: Scope[] = [];
    private properties: PropertyMeta[] = [];

    constructor(name?: string) {
        // TODO: Check for duplicates!
        this.identifier = typeof name === "string" ? name : uuid.v4();
    }

    public include(...scopes: Scope[]): Scope {
        scopes.forEach(includedScope => this.included.push(includedScope));
        // Builder pattern: Return `this`.
        return this;
    }

    public registerProperty(property: PropertyMeta) {
        this.properties.push(property);
    }
}

export function createScope(name?: string) {
    return new Scope(name);
}

export function scope(...scopes: Scope[]): MethodDecorator {
    return function<T>(target: Object, property: string, descriptor: TypedPropertyDescriptor<T>) {
        const original = descriptor.value;
        scopes.forEach(decoratedScope => decoratedScope.registerProperty({
            target, property,
        }));
        return original;
    };
}

export function dump<T>(dumpScope: Scope): (instance: T) => T;
export function dump<T>(dumpScope: Scope, instance: T): T;
export function dump<T>(dumpScope: Scope, arg2?: T): T | ((instance: T) => T) {
    function internalDump(instance: T): T {
        
    }
    if (typeof arg2 !== "undefined") {
        return internalDump(arg2);
    }
    return internalDump;
}
