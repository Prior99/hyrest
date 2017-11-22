import { ApiFailResponse } from "./api-response";

export class ApiError extends Error {
    private statusCode: number;
    private response: ApiFailResponse;
    private originalError: Error;

    constructor(statusCode: number, response: ApiFailResponse, originalError: Error) {
        super();
        Error.captureStackTrace(this, ApiError);
        this.statusCode = statusCode;
        this.response = response;
        this.originalError = originalError;
    }
}
