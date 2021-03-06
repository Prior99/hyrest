import "reflect-metadata";
import { Scope } from "./scope";
import { Constructable } from "./types";
import { is, inferConverter } from "./validation";
import { required } from "./validators";
import { schemaFrom } from "./schema-generator";

/**
 * A parameter decorated to receive the injected body.
 */
export interface BodyParameter {
    /**
     * The index of the parameter that was decorated.
     */
    readonly index: number;
    /**
     * An optional scope to limit populating to. If specified, the decorated parameter
     * will be populated with the body's input.
     */
    readonly scope?: Scope;
    /**
     * The type of the paramter to use for populating.
     */
    readonly paramType?: Constructable<any>;
}

/**
 * Returns a list of parameters decorated to receive a reference to the body.
 * This function is always guaranteed to return an array. If the body has not been injected for this
 * method yet, a new reflection metadata key is created and the new array is returned.
 * The array can be used to append new parameters.
 *
 * @param target The class on which the method for which the decorated parameters should be retrieved exists.
 * @param propertyKey The name of the method on `target` for which the decorated parameters should be retrieved.
 *
 * @return An array of all decorated parameters.
 */
export function getBodyParameters<T extends Object>(target: T, propertyKey: keyof T): BodyParameter[] {
    const bodyParameters = Reflect.getMetadata("api:route:bodyparameters", target, propertyKey as string | symbol);
    if (bodyParameters) {
        return bodyParameters;
    }
    const newBodyParameters: BodyParameter[] = [];
    Reflect.defineMetadata("api:route:bodyparameters", newBodyParameters, target, propertyKey as string | symbol);
    return newBodyParameters;
}

/**
 * A decorator to mark a specific parameter to receive the request's body.
 *
 * **Example:**
 *
 * ```
 * @route(...)
 * public postSomething(@body() body: SomeBody): SomeAnswer {
 * ```
 *
 * If the parameter is decorated with this decorator, the body of each request will be injected
 * into that particular parameter.
 *
 * @param scope An optional scope. If specified, the parameter will be populated using this scope and the
 *              parameter type.
 *
 * @return A parameter decorator to inject the body.
 */
export function body(scope?: Scope): ParameterDecorator {
    return <T extends Object>(target: T, propertyKey: keyof T, index: number) => {
        const paramType = Reflect.getMetadata("design:paramtypes", target, propertyKey as string | symbol)[index];
        const bodyParameters = getBodyParameters(target, propertyKey);
        bodyParameters.push({
            index, scope, paramType,
        });
        if (typeof scope !== "undefined" && typeof paramType !== "undefined") {
            is(inferConverter(paramType))
                .schema(schemaFrom(paramType))
                .scope(scope)
                .validate(required)(target, propertyKey, index);
        }
    };
}

/**
 * A parameter decorated to receive the injected values from the Url's query parameters.
 */
export interface QueryParameter {
    /**
     * The index of the parameter that was decorated.
     */
    readonly index: number;
    /**
     * The name of the query parameter.
     */
    readonly name: string;
}

/**
 * Returns a list of query parameters for the given route method.
 * This function is always guaranteed to return an array. If no query parameters have been injected for this
 * method yet, a new reflection metadata key is created and the new array is returned.
 * The array can be used to append new parameters.
 *
 * @param target The class on which the method for which the decorated parameters should be retrieved exists.
 * @param propertyKey The name of the method on `target` for which the decorated parameters should be retrieved.
 *
 * @return An array of all decorated parameters.
 */
export function getQueryParameters<T extends Object>(target: T, propertyKey: keyof T): QueryParameter[] {
    const queryParameters = Reflect.getMetadata("api:route:queryparameters", target, propertyKey as string | symbol);
    if (queryParameters) {
        return queryParameters;
    }
    const newQueryParameters: QueryParameter[] = [];
    Reflect.defineMetadata("api:route:queryparameters", newQueryParameters, target, propertyKey as string | symbol);
    return newQueryParameters;
}

/**
 * A decorator to mark a specific parameter to receive the given query parameter.
 *
 * **Example:**
 *
 * ```
 * @route(...)
 * public postSomething(@query("search") search: string): SomeAnswer {
 * ```
 *
 * If the parameter is decorated with this decorator, the query parameter named `name` will be injected
 * into this parameter.
 *
 * If the route had been called with `?search=foo`, then the value of `search` will be `foo`.
 *
 * @return A parameter decorator to inject the given query parameter.
 */
export function query(name: string): ParameterDecorator {
    return <T extends Object>(target: T, propertyKey: keyof T, index: number) => {
        const queryParameters = getQueryParameters(target, propertyKey);
        queryParameters.push({
            index,
            name,
        });
    };
}

/**
 * A parameter decorated to receive the injected values from the Url pattern.
 */
export interface UrlParameter {
    /**
     * The index of the parameter that was decorated.
     */
    readonly index: number;
    /**
     * The name of the Url pattern parameter.
     */
    readonly name: string;
}

/**
 * Returns a list of Url parameters for the given route method.
 * This function is always guaranteed to return an array. If no Url parameters have been injected for this
 * method yet, a new reflection metadata key is created and the new array is returned.
 * The array can be used to append new parameters.
 *
 * @param target The class on which the method for which the decorated parameters should be retrieved exists.
 * @param propertyKey The name of the method on `target` for which the decorated parameters should be retrieved.
 *
 * @return An array of all decorated parameters.
 */
export function getUrlParameters<T extends Object>(target: T, propertyKey: keyof T): UrlParameter[] {
    const urlParameters = Reflect.getMetadata("api:route:urlparameters", target, propertyKey as string | symbol);
    if (urlParameters) {
        return urlParameters;
    }
    const newUrlParameters: UrlParameter[] = [];
    Reflect.defineMetadata("api:route:urlparameters", newUrlParameters, target, propertyKey as string | symbol);
    return newUrlParameters;
}

/**
 * A decorator to mark a specific parameter to receive the given Url parameter.
 *
 * **Example:**
 *
 * ```
 * @route("GET", "/user/:id)
 * public postSomething(@param("id") id: string): SomeAnswer {
 * ```
 *
 * If the parameter is decorated with this decorator, the Url parameter named `name` will be injected
 * into this parameter.
 *
 * If the route had been called with `/user/some-uuid-here`, then the value of `id` will be `some-uuid-id-here`.
 *
 * @return A parameter decorator to inject the given Url parameter.
 */
export function param(name: string): ParameterDecorator {
    return <T extends Object>(target: T, propertyKey: keyof T, index: number) => {
        const urlParameters = getUrlParameters(target, propertyKey);
        urlParameters.push({
            index,
            name,
        });
    };
}

/**
 * A parameter decorated to receive the a context.
 */
export interface ContextParameter {
    /**
     * The index of the parameter that was decorated.
     */
    readonly index: number;
}

/**
 * Returns a list of context parameters for the given route method.
 * This function is always guaranteed to return an array. If no context parameters have been injected for this
 * method yet, a new reflection metadata key is created and the new array is returned.
 * The array can be used to append new parameters.
 *
 * @param target The class on which the method for which the decorated parameters should be retrieved exists.
 * @param propertyKey The name of the method on `target` for which the decorated parameters should be retrieved.
 *
 * @return An array of all decorated parameters.
 */
export function getContextParameters<T extends Object>(target: T, propertyKey: keyof T): ContextParameter[] {
    const contextParameters = Reflect.getMetadata("api:route:context", target, propertyKey as string | symbol);
    if (contextParameters) {
        return contextParameters;
    }
    const newContextParameters: ContextParameter[] = [];
    Reflect.defineMetadata("api:route:context", newContextParameters, target, propertyKey as string | symbol);
    return newContextParameters;
}

/**
 * A decorator to mark a specific parameter to receive the given query parameter.
 *
 * **Example:**
 *
 * ```
 * @route(...)
 * public postSomething(@context ctx: any): SomeAnswer {
 * ```
 *
 * If the parameter is decorated with this decorator, the query parameter named `name` will be injected
 * into this parameter.
 *
 * If the route had been called with `?search=foo`, then the value of `search` will be `foo`.
 *
 * @return A parameter decorator to inject the given query parameter.
 */
export function context<T extends Object>(target: T, propertyKey: keyof T, index: number): void {
    const contextParameters = getContextParameters(target, propertyKey);
    contextParameters.push({
        index,
    });
}
