import { Answer } from "./answers";

/**
 * This error will be thrown if the call to a route from the client did not succeed.
 * It transports the HTTP status code as well as the answer from the server if available.
 * Both can be `undefined` if a network failure is the reason for the error.
 */
export class ApiError extends Error {
    /**
     * The HTTP status code. Can be `undefined`.
     */
    public statusCode: number;
    /**
     * The answer from the server. Can be `undefined`.
     */
    public answer: Answer<any>;

    constructor(statusCode: number, answer: Answer<any>) {
        super();
        Error.captureStackTrace(this, ApiError);
        this.statusCode = statusCode;
        this.answer = answer;
    }
}
