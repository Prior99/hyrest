import { Answer } from "./answers";

export class ApiError extends Error {
    private statusCode: number;
    private answer: Answer<any>;

    constructor(statusCode: number, answer: Answer<any>) {
        super();
        Error.captureStackTrace(this, ApiError);
        this.statusCode = statusCode;
        this.answer = answer;
    }
}
