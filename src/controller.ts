import { Constructable } from "./types";
import "isomorphic-fetch";
import "reflect-metadata";

import { Route } from "./route";
import { Params, ApiError, HTTPMethod } from "./types";
import { compile } from "path-to-regexp";
import { isBrowser } from "./is-browser";
import { populate } from "./scope";

export enum ControllerMode {
    SERVER = "server",
    CLIENT = "client",
}

export function getDefaultControllerMode() {
    return isBrowser() ? ControllerMode.CLIENT : ControllerMode.SERVER;
}

function buildQueryString(query: Params) {
    const queryString = Object.keys(query).reduce((result, key) => {
        const unencoded = query[key];
        if (typeof unencoded === "undefined" || unencoded === null) {
            return result;
        }
        const value = encodeURIComponent(unencoded);
        return `${result}&${key}=${value}`;
    }, "");
    // Remove first `&`.
    return queryString.substr(1, queryString.length);
}

/**
 * Assembles a full Url from an express url template, url parameters, as base Url and a query parameters.
 *
 * @param urlParameters The parameters fed to the express url template specified in `subUrl`.
 * @param query The query parameters for the url.
 * @param baseUrl The url to which the template url in `subUrl` is relative to.
 * @param subUrl An url template as used in express.
 *
 * @return The assembled Url.
 */
export function buildUrl(urlParameters: Params, query: Params, baseUrl: string, subUrl: string) {
    const queryString = buildQueryString(query);
    // The url parameters need to be explicitly converted to string as they will be transported via
    // the url string.
    const stringifiedParameters = Object.keys(urlParameters).reduce((result, key) => {
        result[key] = `${urlParameters[key]}`;
        return result;
    }, {} as any);

    // Compile the route's pattern (This is the reverse of what express does with url patterns) and
    // feed it the url parameters which had been converted to string.
    const routeString = compile(subUrl)(stringifiedParameters);

    // Assemble the full url.
    return `${baseUrl}${routeString}?${queryString}`;
}

/**
 * A handler which will be called whenever an Api error is encountered.
 *
 * @param error The Api error that was encountered.
 */
export type ErrorHandler = (error: ApiError) => void;

/**
 * Options with which a controller can be configured.
 * The options are used for all instances of a Controller class.
 */
export interface ControllerOptions {
    /**
     * If set to `true` the controller will `throw` whenever an error is encountered.
     * Default is `true`.
     */
    readonly throwOnError?: boolean;
    /**
     * When supplied, this handler will be called for all errors encountered by this controller.
     */
    readonly errorHandler?: ErrorHandler;
    /**
     * A base Url on which the backend can be publicly reached.
     */
    readonly baseUrl?: string;
    /**
     * Can be `ControllerMode.CLIENT` or `ControllerMode.SERVER`. This is autodetected by default
     * and `ControllerMode.CLIENT` will be used in the browser. This determines if the controller
     * will be used to serve the Api or consume it.
     */
    readonly mode?: ControllerMode;
}

export class Controller {
    public throwOnError = true;
    public errorHandler: ErrorHandler;
    public baseUrl: string;
    public mode: ControllerMode = getDefaultControllerMode();

    constructor(options: ControllerOptions) {
        if (options) {
            this.configure(options);
        }
    }

    /**
     * Will be called by `configureController` and applies the given options to this controller.
     */
    public configure(options: ControllerOptions) {
        const { throwOnError, errorHandler, baseUrl, mode } = options;
        if (typeof throwOnError !== "undefined") { this.throwOnError = throwOnError; }
        if (typeof errorHandler !== "undefined") { this.errorHandler = errorHandler; }
        if (typeof baseUrl !== "undefined") { this.baseUrl = baseUrl; }
        if (typeof mode !== "undefined") { this.mode = mode; }
    }

    /**
     * Will be called instead of each route's body when running in `CLIENT` mode. This function
     * will perform the `fetch` against the backend endpoint.
     *
     * @param route The Route meta information for the method for which the functions was called.
     * @param parameters The Url parameters.
     * @param body The body.
     * @param query The query parameters.
     *
     * @return The unwrapped answer from the backend.
     */
    public async wrappedFetch<T>(route: Route, urlParameters: Params, body: any, query: Params): Promise<T> {
        try {
            // Create the url from the given inputs.
            const url = buildUrl(urlParameters, query, this.baseUrl, route.url);

            // Prepare the headers.
            const headers = new Headers();
            headers.append("content-type", "application/json");

            // Perform the actual fetch.
            const response = await fetch(url, {
                body: JSON.stringify(body),
                headers,
                method: route.method,
            });

            // Parse the response from the Api as JSON.
            const answer = await response.json();

            // If the response's status code was a 2xx status code, return the response as it succeeded.
            if (response.ok) {
                const routeData = answer.data;
                if (typeof route.returnType !== "undefined" && typeof route.scope !== "undefined") {
                    if (Array.isArray(routeData)) {
                        return populate(route.scope, Array, route.returnType, routeData);
                    }
                    return populate(route.scope, route.returnType, routeData);
                }
                return routeData;
            }

            // Otherwise, create an error and handle it according to the controller's configuration.
            // This happens by throwing it, which will raise it to the `catch` block below.
            // That block will then perform the actual error handling.
            const error = new ApiError(response.status, answer);
            throw error;
        } catch (error) {
            // Error's might occur as the network might be interrupted or the response might be malformed.
            // Also an error might be thrown by the `try` block above, if a non-2xx status code has been received.
            if (this.errorHandler) {
                this.errorHandler(error);
            }
            if (this.throwOnError) {
                throw error;
            }
        }
    }
}

export function controller(options?: ControllerOptions): ClassDecorator;
export function controller<U, T extends Constructable<U>>(target: T): T;
/**
 * Decorate an individual class as an Api controller.
 *
 * @param options Global options with which this controller can be configured. `configureController` can also set
 *                set and override these options.
 *
 * @return The decorated class.
 */
export function controller<T extends Function>(arg1: ControllerOptions | T): ClassDecorator | T {
    let decorator: (target: T) => T;
    const options = typeof arg1 === "object" ? arg1 : undefined;
    decorator = function(target: T): T {
        Reflect.defineMetadata("api:controller", new Controller(options), target);
        return target;
    };
    if (typeof arg1 === "function") {
        return decorator(arg1 as T);
    }
    return decorator as ClassDecorator;
}
