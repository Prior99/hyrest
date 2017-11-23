import "isomorphic-fetch";
import "reflect-metadata";

import { HTTPMethod } from "./http-method";
import { Route } from "./route";
import { Params } from "./parameters";
import { ApiError } from "./api-error";
import { compile } from "path-to-regexp";
import { isBrowser } from "./is-browser";
import { Answer } from "./answers";

export enum ControllerMode {
    SERVER = "server",
    CLIENT = "client",
}

function getDefaultControllerMode() {
    return isBrowser() ? ControllerMode.CLIENT : ControllerMode.SERVER;
}

export type ErrorHandler = (error: ApiError) => void;

export interface ControllerOptions {
    readonly throwOnError?: boolean;
    readonly errorHandler?: ErrorHandler;
    readonly baseUrl?: string;
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

    public configure(options: ControllerOptions) {
        const { throwOnError, errorHandler, baseUrl, mode } = options;
        if (typeof throwOnError !== "undefined") { this.throwOnError = throwOnError; }
        if (typeof errorHandler !== "undefined") { this.errorHandler = errorHandler; }
        if (typeof baseUrl !== "undefined") { this.baseUrl = baseUrl; }
        if (typeof mode !== "undefined") { this.mode = mode; }
    }

    public async wrappedFetch<T>(route: Route, parameters: Params, body: any, query: Params): Promise<T> {
        try {
            const queryString = Object.keys(query).reduce((result, key) => {
                return `${result}&${key}=${query[key]}`;
            }, "?");
            const stringifiedParameters = Object.keys(parameters).reduce((result, key) => {
                result[key] = `${parameters[key]}`;
                return result;
            }, {} as any);
            const routeString = compile(route.url)(stringifiedParameters);
            const url = `${this.baseUrl}${routeString}${queryString}`;
            const headers = new Headers();
            headers.append("content-type", "application/json");
            const response = await fetch(url, {
                body: JSON.stringify(body),
                headers,
                method: route.method,
            });
            const answer: Answer<T> = await response.json();
            if (response.ok) {
                return answer.data;
            }
            const error = new ApiError(response.status, answer);
            if (this.errorHandler) {
                this.errorHandler(error);
            }
            if (this.throwOnError) {
                throw error;
            }
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler(error);
            }
            if (this.throwOnError) {
                throw error;
            }
        }
    }
}

export function controller<Decorated extends Function>(options?: ControllerOptions): ClassDecorator {
    return function(target: Decorated): Decorated {
        Reflect.defineMetadata("api:controller", new Controller(options), target);
        return target;
    } as ClassDecorator;
}
