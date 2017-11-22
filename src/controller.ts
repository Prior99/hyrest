import "isomorphic-fetch";
import { HTTPMethod } from "./http-method";
import { Route } from "./route";
import { Parameters } from "./parameters";
import { ApiError } from "./api-error";
import { compile } from "path-to-regexp";
import { ApiSuccessResponse, ApiFailResponse } from "./api-response";
import { isBrowser } from "./is-browser";

export enum ControllerMode {
    SERVER = "server",
    CLIENT = "client",
}

function getDefaultControllerMode() {
    return isBrowser() ? ControllerMode.CLIENT : ControllerMode.SERVER;
}

export type ErrorHandler = (error: ApiError) => void;

export interface ControllerOptions {
    readonly throwOnError: boolean;
    readonly errorHandler: ErrorHandler;
    readonly baseUrl: string;
    readonly mode: ControllerMode;
}

export class Controller {
    public throwOnError = false;
    public errorHandler: ErrorHandler;
    public baseUrl: string;
    public mode: ControllerMode = getDefaultControllerMode();
    public routes: Route[];

    constructor(options: ControllerOptions) {
        this.throwOnError = options.throwOnError;
        this.errorHandler = options.errorHandler;
        this.baseUrl = options.baseUrl;
        this.mode = options.mode;
    }

    public async wrappedFetch<ReturnType>(route: Route, parameters: Parameters, body: any): Promise<ReturnType> {
        try {
            const url = compile(route.url)(parameters);
            const headers = new Headers();
            headers.append("content-type", "application/json");
            const response = await fetch(url, {
                body: JSON.stringify(body),
                headers,
                method: route.method,
            });
            const json = await response.json();
            if (response.ok) {
                const successResponse: ApiSuccessResponse<ReturnType> = json;
                return successResponse.data;
            }
            const failResponse: ApiFailResponse = json;
            const error = new ApiError(response.status, failResponse);
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

    public addRoute(route: Route) {
        this.routes.push(route);
    }
}

export function controller<Decorated extends Function>(options?: ControllerOptions): ClassDecorator {
    return function(target: Decorated): Decorated {
        Reflect.defineMetadata("api:controller", new Controller(options), target);
        return target;
    } as ClassDecorator;
}
