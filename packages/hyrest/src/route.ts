import "reflect-metadata";
import { HTTPMethod, Params, Constructable } from "./types";
import { ControllerMode, Controller } from "./controller";
import {
    QueryParameter,
    BodyParameter,
    UrlParameter,
    getBodyParameters,
    getQueryParameters,
    getUrlParameters,
} from "./parameters";
import { Scope } from "./scope";

/**
 * Additional options which can be passed to a Route.
 */
export interface RouteOptions {
}

/**
 * A route which can be called via REST.
 */
export interface Route<T extends Object> {
    /**
     * The target object which had been decorated with this route.
     * This is the class decorated with @controller.
     */
    readonly target: T;
    /**
     * The name of the method decorated with @route on `target`.
     */
    readonly property: keyof T;
    /**
     * The HTTP method ("GET", "POST", ...).
     */
    readonly method: HTTPMethod;
    /**
     * The express-compatible Url pattern.
     */
    readonly url: string;
    /**
     * Additional configuration options for this route.
     */
    readonly options?: RouteOptions;
    /**
     * An optional scope to use for dumping, stored using `.dump(...)`.
     */
    readonly scope?: Scope;
    /**
     * An optional type to use for dumping, stored using `dump(...)`.
     */
    readonly returnType?: Constructable<any>;
}

export interface RouteFunction {
    /**
     * Method decorator signature.
     */
    <T>(target: Object, property: string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T>;
    /**
     * An optional scope to use for dumping, stored using `.dump(...)`.
     */
    scope?: Scope;
    /**
     * An optional type to use for dumping, stored using `dump(...)`.
     */
    returnType?: Constructable<any>;
    /**
     * Call this function to have the route automatically dump the data using the scope and type
     * and populate it again on the client side.
     */
    dump: (returnType: Constructable<any>, scope: Scope) => RouteFunction;
}

/**
 * Returns a list of all routes on `target`. This function is always guaranteed to return an array.
 * If no routes existed on `target` a new refelect metadata key will be created and a new array will
 * be returned.
 *
 * The array can be used to append new routes.
 *
 * @param target The class decorated with @controller for which all routes should be listed.
 *
 * @return An array of all routes on the given `target.
 */
export function getRoutes<T extends Object>(target: T): Route<T>[] {
    const routes = Reflect.getMetadata("api:routes", target);
    if (routes) {
        return routes;
    }
    const newRoutes: Route<T>[] = [];
    Reflect.defineMetadata("api:routes", newRoutes, target);
    return newRoutes;
}

/**
 * This decorated can be used to define a new REST route on a specific controller.
 * Decorate a method with it and the method will be called if a matching request has been caught by the
 * express middleware.
 *
 * **Example:**
 *
 * ```
 * @route("GET", "/user/:id")
 * public getUser(...) {
 * ```
 *
 * @param method The HTTP method ("GET", "POST", ..) to which this route should be sensitive.
 * @param url An express-compatiable Url pattern (e.g. `/user/:id`) which this route should match.
 * @param options Additional options for the route. @see RouteOptions
 *
 * @return A method decorator.
 */
export function route(method: HTTPMethod, url: string, options?: RouteOptions): RouteFunction {
    const fn: any = function<T>(target: T, property: keyof T, descriptor: PropertyDescriptor) {
        const { scope, returnType } = fn;
        // Insert the new `Route` into the reflection metadata.
        const routeMeta: Route<T> = { target, property, method, url, options, scope, returnType };
        const routes = getRoutes(target);
        routes.push(routeMeta);

        // Get all injected parameters.
        const queryParameters = getQueryParameters(target, property);
        const bodyParameters = getBodyParameters(target, property);
        const urlParameters = getUrlParameters(target, property);

        // Store the original function before overwriting the method with a wrapper calling the REST endpoint
        // instead if the parent @controller is in `CLIENT` mode.
        const originalFunction = descriptor.value;
        descriptor.value = function (...args: any[]) {
            // Get the parent @controller and throw an error if the route was created in a non-@controller class.
            const controller: Controller<T> = Reflect.getMetadata("api:controller", target.constructor);
            if (!controller) {
                const name = target.constructor.name;
                throw new Error(`Found @route on a class without @controller. Take a look at ${name}.`);
            }

            // If in `CLIENT` mode, call the REST endpoint instead.
            if (controller.mode === ControllerMode.CLIENT) {
                // Find all query parameters based on the @query decorators.
                const query = queryParameters.reduce((result, param) => {
                    result[param.name] = args[param.index];
                    return result;
                }, {} as Params);
                // Find a body paramter based on the @body decorator.
                const body = bodyParameters.length > 0 ? args[bodyParameters[0].index] : undefined;
                // Find all Url paramters based on the @param decorators.
                const parameters = urlParameters.reduce((result, param) => {
                    result[param.name] = args[param.index];
                    return result;
                }, {} as Params);
                // Make the actual REST call and return it's Promise.
                return controller.wrappedFetch(routeMeta, parameters, body, query);
            }

            // Otherwise, just call the original function with the original arguments.
            return originalFunction.apply(this, args); // tslint:disable-line
        };
        return descriptor;
    };
    fn.dump = (returnType: Constructable<any>, scope: Scope) => {
        fn.returnType = returnType;
        fn.scope = scope;
        return fn;
    };
    return fn as RouteFunction;
}
