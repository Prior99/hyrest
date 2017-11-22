import "isomorphic-fetch";
import { HTTPMethod } from "./http-method";
import { Route } from "./route";
import { Parameters } from "./parameters";
import { ApiError } from "./api-error";
import { compile } from "path-to-regexp";
import { ApiSuccessResponse, ApiFailResponse } from "./api-response";

export interface ControllerOptions {

}

export type ErrorHandler = (error: ApiError) => void;

export class Controller {
    private throwOnError = false;
    private errorHandler: ErrorHandler;

    public configure(options: ControllerOptions): Controller {
        return this;
    }

    public async wrappedFetch<ReturnType>(route: Route, parameters: Parameters, body: any): ReturnType {
        const url = compile(route.url)(parameters);
        const headers = new Headers();
        headers.append("content-type", "application/json");
        try {
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
            return;
        } catch(error) {
            if (this.errorHandler) {
                this.errorHandler(error);
            }
            if (this.throwOnError) {
                throw error;
            }
        }
    }
}
