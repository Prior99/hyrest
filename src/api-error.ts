import { ApiFailResponse } from "./api-response";

export class ApiError extends Error {
    private statusCode: number;
    private response: ApiFailResponse;

    constructor(statusCode: number, response: ApiFailResponse) {
        super();
        Error.captureStackTrace(this, ApiError);
        this.statusCode = statusCode;
        this.response = response;
    }
}
