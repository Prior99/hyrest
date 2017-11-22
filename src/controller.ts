import "isomorphic-fetch";
import { HTTPMethod } from "./http-method";
import { Route } from "./route";
import { Parameters } from "./parameters";
import { ApiError } from "./api-error";
import { compile } from "path-to-regexp";

export interface ControllerOptions {

}

export type ErrorHandler = (error: ApiError) => void;

export class Controller {
    private throwOnError = false;
    private errorHandler: ErrorHandler;

    public configure(options: ControllerOptions): Controller {
        return this;
    }

    public async wrappedFetch<ReturnType>(route: Route, parameters: Parameters, body: any): ApiResponse<ReturnType> {
        const url = compile(route.url)(parameters);
        const response = await fetch(url, {
            body: JSON.
        });
    }
}
