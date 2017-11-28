import "reflect-metadata";
import * as uuid from "uuid";

export interface PropertyMeta {
    /**
     * The prototype of the class on which the property was decorated.
     */
    readonly target: Object;
    /**
     * The name of the property that was decorated.
     */
    readonly property: string;
}

export class Scope {
    public identifier: string;

    private included: Scope[] = [];
    private ownProperties: PropertyMeta[] = [];

    constructor(name?: string) {
        // TODO: Check for duplicates!
        this.identifier = typeof name === "string" ? name : uuid.v4();
    }

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
        }, this.ownProperties);
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
 * Create a new scope with an optional name.
 *
 * @param name An optional unique identifier for this scope. If not provided, a uuid will be used.
 *
 * @return A new scope.
 */
export function createScope(name?: string) {
    return new Scope(name);
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
        scopes.forEach(decoratedScope => decoratedScope.registerProperty({
            target, property,
        }));
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
