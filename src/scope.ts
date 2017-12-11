import "reflect-metadata";

import { Constructable } from "./types";
import * as invariant from "invariant";
import { allKeys } from "./all-keys";
import { getTransforms } from "./transform";
import { isCustomClass } from "./validation";

export type TypeCreator = () => Constructable<any>;

export interface SpecifiedTypes {
    /**
     * Types specified for method's parameters.
     */
    params: Map<number, TypeCreator>;
    /**
     * The type specified for the property itself.
     */
    property?: TypeCreator;
}

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
     *
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
     *
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
        return this.properties.filter(property => {
            let current = clazz;
            while (current !== null && typeof current !== "undefined") { // tslint:disable-line
                if (property.target.constructor === current) {
                    return true;
                }
                current = Object.getPrototypeOf(current);
            }
        });
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
export function scope(...scopes: Scope[]) {
    return function<T>(target: Object, property: string, descriptor?: PropertyDescriptor) {
        const expectedType = Reflect.getMetadata("design:type", target, property);
        scopes.forEach(decoratedScope => decoratedScope.registerProperty({
            target, property, expectedType,
        }));
    };
}

/**
 * Returns the specified types for a property and its parameters. Is always guaranteed to
 * return an object. If non existed, a new one is created.
 *
 * @param target The target object of which to get the specified types.
 * @param property The property on `target` on which to get the specified types.
 *
 * @return An object containing the type of the property and a map for all its parameters.
 */
export function getSpecifiedType(target: Object, property: string | symbol): SpecifiedTypes {
    let specified = Reflect.getMetadata("specifytype", target, property);
    if (typeof specified === "undefined") {
        specified = {
            params: new Map(),
        };
        Reflect.defineMetadata("specifytype", specified, target, property);
    }
    return specified;
}

/**
 * Help to specify the type of a property or paramter. Might be necessary for arrays and cyclic
 * depdendencies.
 *
 * @param factory A function with no arguments returning the desired type.
 *
 * @return A decorator for a property or a parameter.
 */
export function specify<T>(factory: TypeCreator) {
    return function(target: Object, property: string | symbol, arg3?: any) {
        const specified = getSpecifiedType(target, property);
        if (typeof arg3 === "number") {
            specified.params.set(arg3, factory);
            return;
        }
        specified.property = factory;
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
        if (typeof instance === "object" && instance !== null) {
            const propertiesForClass = dumpScope.propertiesForClass(instance.constructor);
            const keys = allKeys(instance);
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
export function populate<T>(
    populateScope: Scope, initialClass: Constructable<T>, arrayType: Constructable<T>): (data: any) => T;
export function populate<T>(
    populateScope: Scope, initialClass: Constructable<T>, arrayType: Constructable<T>, data: any): T;
/**
 * Populate a structure of classes using an object and a scope.
 * This will recursively create instances of all classes and populate them with the nested objects in
 * the input.
 *
 * @param populateScope The scope to populate. Only properties included in this scope will be populated.
 * @param initialClass The class to start populating with.
 *             It can also be invoked with an additional array type.
 * @param arg4 When populating an array, an additional array type must be specified as the thrid argument
 *             and the data is specified as the fourth argument instead.
 *
 * @return A curried function for use in higher order functions if `arg3` is not specified and the populated
 *         structure otherwise.
 */
export function populate<T>(
    populateScope: Scope, initialClass: Constructable<T>, arg3?: any, arg4?: any,
): T | ((data: T) => T) {
    function internalPopulate<U extends any | any[]>(
        data: any, thisClass: any, specifiedClass: Constructable<any>,
    ): U {
        // Perform population of an array.
        if (thisClass === Array) {
            invariant(Array.isArray(data), "Structure does not match. Array expected.");
            invariant(typeof specifiedClass === "function", "Array type not specified.");
            return (data as any[]).map(element => internalPopulate(element, specifiedClass, undefined)) as any as U;
        }
        const guardedClass = thisClass || specifiedClass;
        // Ignore primitives.
        if (guardedClass === Number || guardedClass === Boolean || guardedClass === String || guardedClass === Object) {
            return data;
        }
        invariant(typeof data === "object" && !Array.isArray(data), "Structure does not match. Object expected.");
        if (typeof guardedClass !== "function") {
            throw new Error("Could not infer type. This might be due to a cyclic dependency.");
        }
        // Instanciate the classe to populate.
        const instance = new guardedClass();
        // Get a list of all properties to populate.
        const propertiesForClass = populateScope.propertiesForClass(guardedClass);
        propertiesForClass.forEach(({ property, target, expectedType }) => {
            const dataValue = (data as any)[property];
            if (typeof dataValue === "undefined") {
                return;
            }
            const specifyTypeCreator = getSpecifiedType(target, property).property;
            const specifyType = specifyTypeCreator && specifyTypeCreator();
            const transforms = getTransforms(target, property);
            const populated = internalPopulate(dataValue, expectedType, specifyType);
            if (transforms.propertyTransform) {
                (instance as any)[property] = transforms.propertyTransform(populated);
            } else {
                (instance as any)[property] = populated;
            }
        });
        return instance;
    }
    // `arg3` can either be array type or data.
    if (typeof arg3 !== "undefined") {
        // `arg3 is the array type and `arg4` is the data.
        if (typeof arg4 !== "undefined") {
            return internalPopulate(arg4, initialClass, arg3);
        }
        // If `arg3` is a `Constructable`: It's the array type and a curried version shall be returned.
        if (typeof arg3 === "function") {
            return (data: any) => internalPopulate(data, initialClass, arg3);
        }
        // `arg3 is simply the data and no array type is specified.
        return internalPopulate(arg3, initialClass, undefined);
    }
    return (data: any) => internalPopulate(data, initialClass, undefined);
}
