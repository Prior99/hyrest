import "reflect-metadata";

import { Constructable } from "./types";
import * as invariant from "invariant";

export interface PropertyMeta {
    /**
     * The prototype of the class on which the property was decorated.
     */
    readonly target: Object;
    /**
     * The name of the property that was decorated.
     */
    readonly property: string;
    /**
     * The expected type for this property.
     */
    readonly expectedType: any | any[];
}

export class Scope {
    private included: Scope[] = [];
    private ownProperties: PropertyMeta[] = [];

    /**
     * Include all properties from another scope in this scope:
     *
     * **Example:**
     * ```
     * const exampleA = createScope();
     * const exampleB = createScope().include(exampleA);
     *
     * class A {
     *     @scope(exampleA)
     *     public property1: string;
     *
     *     @scope(exampleB)
     *     public property2: string;
     * }
     *
     * console.log(exampleA.properties); // Only `property1`.
     * console.log(exampleB.properties); // Will be `property1` and `property2`.
     * ```
     * @param scopes A list of scopes to include in this scope.
     *
     * @return This instance to use this method for the builder pattern.
     */
    public include(...scopes: Scope[]): Scope {
        scopes.forEach(includedScope => this.included.push(includedScope));
        // Builder pattern: Return `this`.
        return this;
    }

    public registerProperty(property: PropertyMeta) {
        this.ownProperties.push(property);
    }

    /**
     * All properties decorated by `@scope` with this scope and all properties
     * included by using `include()`.
     */
    public get properties() {
        return this.included.reduce((result, included) => {
            result.push(...included.properties);
            return result;
        }, [ ...this.ownProperties ]);
    }

    /**
     * Will return all properties for a specific class.
     *
     * **Example:**
     * ```
     * const example = createScope();
     *
     * class A {
     *     @scope(example)
     *     public property1: string;
     * }
     *
     * class B {
     *     @scope(example)
     *     public property2: string;
     * }
     *
     * console.log(example.propertiesForClass(A)); // Only `property1` is returned.
     * console.log(example.propertiesForClass(A)); // Only `property2` is returned.
     * ```
     *
     * This method takes all properties included using `include()` into account.
     *
     * @param clazz The clazz to return the properties for.
     *
     * @return All properties from the specified class.
     */
    public propertiesForClass(clazz: Function) {
        return this.properties.filter(property => property.target.constructor === clazz);
    }
}

/**
 * Create a new scope.
 *
 * @return A new scope.
 */
export function createScope() {
    return new Scope();
}

/**
 * Use this decorator to mark a property, getter or a setter on a class as belonging to a scope
 * so they are included when `dump()`ing or `populate()`ing them.
 *
 * @param scopes The list of scopes in which the decorated property should be included.
 *
 * @return A decorator which can be used to decorate getters, setters and properties.
 *
 * @see dump
 * @see populate
 */
export function scope(...scopes: Scope[]): MethodDecorator {
    return function<T>(target: Object, property: string, descriptor?: TypedPropertyDescriptor<T>) {
        const expectedType = Reflect.getMetadata("design:type", target, property);
        scopes.forEach(decoratedScope => decoratedScope.registerProperty({
            target, property, expectedType,
        }));
    };
}

export function arrayOf<T>(clazz: Constructable<T>): MethodDecorator {
    return function<U>(target: Object, property: string, descriptor?: TypedPropertyDescriptor<U>) {
        Reflect.defineMetadata("arrayof", clazz, target, property);
    };
}

export function dump<T>(dumpScope: Scope): (instance: T) => T;
export function dump<T>(dumpScope: Scope, instance: T): T;
/**
 * Dump a structure with a given scope. This can either be invoked using the curried syntax
 * (`dump(scope)(obj)` or regularly (`dump(scope, obj)`).
 * This will dump the structure as new, plain objects, including only the keys marked with the
 * `@scope` decorator and the specified scope.
 *
 * @param dumpScope The scope used for dumping.
 * @param arg2 The instance to dump.
 *
 * @return The dumped, stripped down version of the input object.
 */
export function dump<T>(dumpScope: Scope, arg2?: T): T | ((instance: T) => T) {
    function internalDump<U extends any | any[]>(instance: U): U {
        if (Array.isArray(instance)) {
            return instance.map(internalDump) as any as U;
        }
        if (typeof instance === "object") {
            const propertiesForClass = dumpScope.propertiesForClass(instance.constructor);
            const keys = Object.keys(instance);
            return keys.reduce((result, key) => {
                if (propertiesForClass.find(({ property }) => property === key)) {
                    (result as any)[key] = internalDump((instance as any)[key]);
                }
                return result;
            }, {}) as U;
        }
        return instance;
    }
    if (typeof arg2 !== "undefined") {
        return internalDump(arg2);
    }
    return internalDump;
}

export function populate<T>(populateScope: Scope, initialClass: Constructable<T>): (data: any) => T;
export function populate<T>(populateScope: Scope, initialClass: Constructable<T>, data: any): T;
/**
 * Populate a structure of classes using an object and a scope.
 * This will recursively create instances of all classes and populate them with the nested objects in
 * the input.
 *
 * @param populateScope The scope to populate. Only properties included in this scope will be populated.
 * @param initialClass The class to start populating with.
 * @param arg3 Populate can be invoked with the input as a third argument or be used as a curried function.
 *             If this is specified, the non-curried version is used. Otherwise the curried function accepting
 *             this as an argument is returned. This is usefull for using this inside higher order functions.
 *
 * @return A curried function for use in higher order functions if `arg3` is not specified and the populated
 *         structure otherwise.
 */
export function populate<T>(populateScope: Scope, initialClass: Constructable<T>, arg3?: any): T | ((data: T) => T) {
    function internalPopulate<U extends any | any[]>(
        data: any, thisClass: any = initialClass, arrayClass?: Constructable<any>,
    ): U {
        // Perform population of an array.
        if (thisClass === Array) {
            invariant(Array.isArray(data), "Structure does not match. Array expected.");
            invariant(typeof arrayClass === "function", "Structure does not match. Array expected.");
            return (data as any[]).map(element => internalPopulate(element, arrayClass)) as any as U;
        }
        // Ignore primitives.
        if (thisClass === Number || thisClass === Boolean || thisClass === String || thisClass === Object) {
            return data;
        }
        invariant(typeof data === "object" && !Array.isArray(data), "Structure does not match. Object expected.");
        // Instanciate the classe to populate.
        const instance = new thisClass();
        // Get a list of all properties to populate.
        const propertiesForClass = populateScope.propertiesForClass(thisClass);
        propertiesForClass.forEach(({ property, target, expectedType }) => {
            const dataValue = (data as any)[property];
            if (typeof dataValue === "undefined") {
                return;
            }
            const nextOverrideClass = Reflect.getMetadata("arrayof", target, property);
            (instance as any)[property] = internalPopulate(dataValue, expectedType, nextOverrideClass);
        });
        return instance;
    }
    if (typeof arg3 !== "undefined") {
        return internalPopulate(arg3);
    }
    return internalPopulate;
}
