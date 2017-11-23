import * as HTTP from "http-status-codes";

export interface Answer<T> {
    readonly message?: string;
    readonly data?: T;
}

export interface WrappedAnswer<T> {
    readonly statusCode: number;
    readonly result: Answer<T>;
}

export interface Wrapper<T> {
    readonly body?: T;
    readonly message?: string;

}

function isWrapper(wrapper: any): wrapper is Wrapper<any> {
    if (typeof wrapper !== "object") {
        return false;
    }
    return Object.keys(wrapper).every(key => ["message", "body"].includes(key));
}

function answer(statusCode: number, ...args: any[]): any {
    if (args.length === 0) {
        return {
            statusCode,
        };
    }
    if (args.length === 1) {
        if (isWrapper(args[0])) {
            const { message, data } = args[0];
            return {
                statusCode,
                result: {
                    message,
                    data,
                },
            };
        }
        if (typeof args[0] === "string") {
            return {
                statusCode,
                result: {
                    message: args[0],
                },
            };
        }
        return {
            statusCode,
            result: {
                data: args[0],
            },
        };
    }
    return {
        statusCode,
        result: {
            data: args[0],
            message: args[1],
        },
    };
}

export function accepted<T>(wrapper: Wrapper<T>): T;
export function accepted<T>(body?: T): T;
export function accepted<T>(message?: string): T;
export function accepted<T>(body?: T, message?: string): T;
export function accepted<T>(...args: any[]): T {
    return answer(HTTP.ACCEPTED, ...args) as T;
}

export function badGateway<T>(wrapper: Wrapper<T>): T;
export function badGateway<T>(body?: T): T;
export function badGateway<T>(message?: string): T;
export function badGateway<T>(body?: T, message?: string): T;
export function badGateway<T>(...args: any[]): T {
    return answer(HTTP.BAD_GATEWAY, ...args) as T;
}

export function badRequest<T>(wrapper: Wrapper<T>): T;
export function badRequest<T>(body?: T): T;
export function badRequest<T>(message?: string): T;
export function badRequest<T>(body?: T, message?: string): T;
export function badRequest<T>(...args: any[]): T {
    return answer(HTTP.BAD_REQUEST, ...args) as T;
}

export function conflict<T>(wrapper: Wrapper<T>): T;
export function conflict<T>(body?: T): T;
export function conflict<T>(message?: string): T;
export function conflict<T>(body?: T, message?: string): T;
export function conflict<T>(...args: any[]): T {
    return answer(HTTP.CONFLICT, ...args) as T;
}

export function httpContinue<T>(wrapper: Wrapper<T>): T;
export function httpContinue<T>(body?: T): T;
export function httpContinue<T>(message?: string): T;
export function httpContinue<T>(body?: T, message?: string): T;
export function httpContinue<T>(...args: any[]): T {
    return answer(HTTP.CONTINUE, ...args) as T;
}

export function created<T>(wrapper: Wrapper<T>): T;
export function created<T>(body?: T): T;
export function created<T>(message?: string): T;
export function created<T>(body?: T, message?: string): T;
export function created<T>(...args: any[]): T {
    return answer(HTTP.CREATED, ...args) as T;
}

export function expectationFailed<T>(wrapper: Wrapper<T>): T;
export function expectationFailed<T>(body?: T): T;
export function expectationFailed<T>(message?: string): T;
export function expectationFailed<T>(body?: T, message?: string): T;
export function expectationFailed<T>(...args: any[]): T {
    return answer(HTTP.EXPECTATION_FAILED, ...args) as T;
}

export function failedDependency<T>(wrapper: Wrapper<T>): T;
export function failedDependency<T>(body?: T): T;
export function failedDependency<T>(message?: string): T;
export function failedDependency<T>(body?: T, message?: string): T;
export function failedDependency<T>(...args: any[]): T {
    return answer(HTTP.FAILED_DEPENDENCY, ...args) as T;
}

export function forbidden<T>(wrapper: Wrapper<T>): T;
export function forbidden<T>(body?: T): T;
export function forbidden<T>(message?: string): T;
export function forbidden<T>(body?: T, message?: string): T;
export function forbidden<T>(...args: any[]): T {
    return answer(HTTP.FORBIDDEN, ...args) as T;
}

export function gatewayTimeout<T>(wrapper: Wrapper<T>): T;
export function gatewayTimeout<T>(body?: T): T;
export function gatewayTimeout<T>(message?: string): T;
export function gatewayTimeout<T>(body?: T, message?: string): T;
export function gatewayTimeout<T>(...args: any[]): T {
    return answer(HTTP.GATEWAY_TIMEOUT, ...args) as T;
}

export function gone<T>(wrapper: Wrapper<T>): T;
export function gone<T>(body?: T): T;
export function gone<T>(message?: string): T;
export function gone<T>(body?: T, message?: string): T;
export function gone<T>(...args: any[]): T {
    return answer(HTTP.GONE, ...args) as T;
}

export function httpVersionNotSupported<T>(wrapper: Wrapper<T>): T;
export function httpVersionNotSupported<T>(body?: T): T;
export function httpVersionNotSupported<T>(message?: string): T;
export function httpVersionNotSupported<T>(body?: T, message?: string): T;
export function httpVersionNotSupported<T>(...args: any[]): T {
    return answer(HTTP.HTTP_VERSION_NOT_SUPPORTED, ...args) as T;
}

export function insufficientSpaceOnResource<T>(wrapper: Wrapper<T>): T;
export function insufficientSpaceOnResource<T>(body?: T): T;
export function insufficientSpaceOnResource<T>(message?: string): T;
export function insufficientSpaceOnResource<T>(body?: T, message?: string): T;
export function insufficientSpaceOnResource<T>(...args: any[]): T {
    return answer(HTTP.INSUFFICIENT_SPACE_ON_RESOURCE, ...args) as T;
}

export function insufficientStorage<T>(wrapper: Wrapper<T>): T;
export function insufficientStorage<T>(body?: T): T;
export function insufficientStorage<T>(message?: string): T;
export function insufficientStorage<T>(body?: T, message?: string): T;
export function insufficientStorage<T>(...args: any[]): T {
    return answer(HTTP.INSUFFICIENT_STORAGE, ...args) as T;
}

export function internalServerError<T>(wrapper: Wrapper<T>): T;
export function internalServerError<T>(body?: T): T;
export function internalServerError<T>(message?: string): T;
export function internalServerError<T>(body?: T, message?: string): T;
export function internalServerError<T>(...args: any[]): T {
    return answer(HTTP.INTERNAL_SERVER_ERROR, ...args) as T;
}

export function lengthRequired<T>(wrapper: Wrapper<T>): T;
export function lengthRequired<T>(body?: T): T;
export function lengthRequired<T>(message?: string): T;
export function lengthRequired<T>(body?: T, message?: string): T;
export function lengthRequired<T>(...args: any[]): T {
    return answer(HTTP.LENGTH_REQUIRED, ...args) as T;
}

export function locked<T>(wrapper: Wrapper<T>): T;
export function locked<T>(body?: T): T;
export function locked<T>(message?: string): T;
export function locked<T>(body?: T, message?: string): T;
export function locked<T>(...args: any[]): T {
    return answer(HTTP.LOCKED, ...args) as T;
}

export function methodFailure<T>(wrapper: Wrapper<T>): T;
export function methodFailure<T>(body?: T): T;
export function methodFailure<T>(message?: string): T;
export function methodFailure<T>(body?: T, message?: string): T;
export function methodFailure<T>(...args: any[]): T {
    return answer(HTTP.METHOD_FAILURE, ...args) as T;
}

export function methodNotAllowed<T>(wrapper: Wrapper<T>): T;
export function methodNotAllowed<T>(body?: T): T;
export function methodNotAllowed<T>(message?: string): T;
export function methodNotAllowed<T>(body?: T, message?: string): T;
export function methodNotAllowed<T>(...args: any[]): T {
    return answer(HTTP.METHOD_NOT_ALLOWED, ...args) as T;
}

export function movedPermanently<T>(wrapper: Wrapper<T>): T;
export function movedPermanently<T>(body?: T): T;
export function movedPermanently<T>(message?: string): T;
export function movedPermanently<T>(body?: T, message?: string): T;
export function movedPermanently<T>(...args: any[]): T {
    return answer(HTTP.MOVED_PERMANENTLY, ...args) as T;
}

export function movedTemporarily<T>(wrapper: Wrapper<T>): T;
export function movedTemporarily<T>(body?: T): T;
export function movedTemporarily<T>(message?: string): T;
export function movedTemporarily<T>(body?: T, message?: string): T;
export function movedTemporarily<T>(...args: any[]): T {
    return answer(HTTP.MOVED_TEMPORARILY, ...args) as T;
}

export function multiStatus<T>(wrapper: Wrapper<T>): T;
export function multiStatus<T>(body?: T): T;
export function multiStatus<T>(message?: string): T;
export function multiStatus<T>(body?: T, message?: string): T;
export function multiStatus<T>(...args: any[]): T {
    return answer(HTTP.MULTI_STATUS, ...args) as T;
}

export function multipleChoices<T>(wrapper: Wrapper<T>): T;
export function multipleChoices<T>(body?: T): T;
export function multipleChoices<T>(message?: string): T;
export function multipleChoices<T>(body?: T, message?: string): T;
export function multipleChoices<T>(...args: any[]): T {
    return answer(HTTP.MULTIPLE_CHOICES, ...args) as T;
}

export function networkAuthenticationRequired<T>(wrapper: Wrapper<T>): T;
export function networkAuthenticationRequired<T>(body?: T): T;
export function networkAuthenticationRequired<T>(message?: string): T;
export function networkAuthenticationRequired<T>(body?: T, message?: string): T;
export function networkAuthenticationRequired<T>(...args: any[]): T {
    return answer(HTTP.NETWORK_AUTHENTICATION_REQUIRED, ...args) as T;
}

export function noContent<T>(wrapper: Wrapper<T>): T;
export function noContent<T>(body?: T): T;
export function noContent<T>(message?: string): T;
export function noContent<T>(body?: T, message?: string): T;
export function noContent<T>(...args: any[]): T {
    return answer(HTTP.NO_CONTENT, ...args) as T;
}

export function nonAuthoritativeInformation<T>(wrapper: Wrapper<T>): T;
export function nonAuthoritativeInformation<T>(body?: T): T;
export function nonAuthoritativeInformation<T>(message?: string): T;
export function nonAuthoritativeInformation<T>(body?: T, message?: string): T;
export function nonAuthoritativeInformation<T>(...args: any[]): T {
    return answer(HTTP.NON_AUTHORITATIVE_INFORMATION, ...args) as T;
}

export function notAcceptable<T>(wrapper: Wrapper<T>): T;
export function notAcceptable<T>(body?: T): T;
export function notAcceptable<T>(message?: string): T;
export function notAcceptable<T>(body?: T, message?: string): T;
export function notAcceptable<T>(...args: any[]): T {
    return answer(HTTP.NOT_ACCEPTABLE, ...args) as T;
}

export function notFound<T>(wrapper: Wrapper<T>): T;
export function notFound<T>(body?: T): T;
export function notFound<T>(message?: string): T;
export function notFound<T>(body?: T, message?: string): T;
export function notFound<T>(...args: any[]): T {
    return answer(HTTP.NOT_FOUND, ...args) as T;
}

export function notImplemented<T>(wrapper: Wrapper<T>): T;
export function notImplemented<T>(body?: T): T;
export function notImplemented<T>(message?: string): T;
export function notImplemented<T>(body?: T, message?: string): T;
export function notImplemented<T>(...args: any[]): T {
    return answer(HTTP.NOT_IMPLEMENTED, ...args) as T;
}

export function notModified<T>(wrapper: Wrapper<T>): T;
export function notModified<T>(body?: T): T;
export function notModified<T>(message?: string): T;
export function notModified<T>(body?: T, message?: string): T;
export function notModified<T>(...args: any[]): T {
    return answer(HTTP.NOT_MODIFIED, ...args) as T;
}

export function ok<T>(wrapper: Wrapper<T>): T;
export function ok<T>(body?: T): T;
export function ok<T>(message?: string): T;
export function ok<T>(body?: T, message?: string): T;
export function ok<T>(...args: any[]): T {
    return answer(HTTP.OK, ...args) as T;
}

export function partialContent<T>(wrapper: Wrapper<T>): T;
export function partialContent<T>(body?: T): T;
export function partialContent<T>(message?: string): T;
export function partialContent<T>(body?: T, message?: string): T;
export function partialContent<T>(...args: any[]): T {
    return answer(HTTP.PARTIAL_CONTENT, ...args) as T;
}

export function paymentRequired<T>(wrapper: Wrapper<T>): T;
export function paymentRequired<T>(body?: T): T;
export function paymentRequired<T>(message?: string): T;
export function paymentRequired<T>(body?: T, message?: string): T;
export function paymentRequired<T>(...args: any[]): T {
    return answer(HTTP.PAYMENT_REQUIRED, ...args) as T;
}

export function preconditionFailed<T>(wrapper: Wrapper<T>): T;
export function preconditionFailed<T>(body?: T): T;
export function preconditionFailed<T>(message?: string): T;
export function preconditionFailed<T>(body?: T, message?: string): T;
export function preconditionFailed<T>(...args: any[]): T {
    return answer(HTTP.PRECONDITION_FAILED, ...args) as T;
}

export function preconditionRequired<T>(wrapper: Wrapper<T>): T;
export function preconditionRequired<T>(body?: T): T;
export function preconditionRequired<T>(message?: string): T;
export function preconditionRequired<T>(body?: T, message?: string): T;
export function preconditionRequired<T>(...args: any[]): T {
    return answer(HTTP.PRECONDITION_REQUIRED, ...args) as T;
}

export function processing<T>(wrapper: Wrapper<T>): T;
export function processing<T>(body?: T): T;
export function processing<T>(message?: string): T;
export function processing<T>(body?: T, message?: string): T;
export function processing<T>(...args: any[]): T {
    return answer(HTTP.PROCESSING, ...args) as T;
}

export function proxyAuthenticationRequired<T>(wrapper: Wrapper<T>): T;
export function proxyAuthenticationRequired<T>(body?: T): T;
export function proxyAuthenticationRequired<T>(message?: string): T;
export function proxyAuthenticationRequired<T>(body?: T, message?: string): T;
export function proxyAuthenticationRequired<T>(...args: any[]): T {
    return answer(HTTP.PROXY_AUTHENTICATION_REQUIRED, ...args) as T;
}

export function requestHeaderFieldsTooLarge<T>(wrapper: Wrapper<T>): T;
export function requestHeaderFieldsTooLarge<T>(body?: T): T;
export function requestHeaderFieldsTooLarge<T>(message?: string): T;
export function requestHeaderFieldsTooLarge<T>(body?: T, message?: string): T;
export function requestHeaderFieldsTooLarge<T>(...args: any[]): T {
    return answer(HTTP.REQUEST_HEADER_FIELDS_TOO_LARGE, ...args) as T;
}

export function requestTimeout<T>(wrapper: Wrapper<T>): T;
export function requestTimeout<T>(body?: T): T;
export function requestTimeout<T>(message?: string): T;
export function requestTimeout<T>(body?: T, message?: string): T;
export function requestTimeout<T>(...args: any[]): T {
    return answer(HTTP.REQUEST_TIMEOUT, ...args) as T;
}

export function requestTooLong<T>(wrapper: Wrapper<T>): T;
export function requestTooLong<T>(body?: T): T;
export function requestTooLong<T>(message?: string): T;
export function requestTooLong<T>(body?: T, message?: string): T;
export function requestTooLong<T>(...args: any[]): T {
    return answer(HTTP.REQUEST_TOO_LONG, ...args) as T;
}

export function requestUriTooLong<T>(wrapper: Wrapper<T>): T;
export function requestUriTooLong<T>(body?: T): T;
export function requestUriTooLong<T>(message?: string): T;
export function requestUriTooLong<T>(body?: T, message?: string): T;
export function requestUriTooLong<T>(...args: any[]): T {
    return answer(HTTP.REQUEST_URI_TOO_LONG, ...args) as T;
}

export function requestedRangeNotSatisfiable<T>(wrapper: Wrapper<T>): T;
export function requestedRangeNotSatisfiable<T>(body?: T): T;
export function requestedRangeNotSatisfiable<T>(message?: string): T;
export function requestedRangeNotSatisfiable<T>(body?: T, message?: string): T;
export function requestedRangeNotSatisfiable<T>(...args: any[]): T {
    return answer(HTTP.REQUESTED_RANGE_NOT_SATISFIABLE, ...args) as T;
}

export function resetContent<T>(wrapper: Wrapper<T>): T;
export function resetContent<T>(body?: T): T;
export function resetContent<T>(message?: string): T;
export function resetContent<T>(body?: T, message?: string): T;
export function resetContent<T>(...args: any[]): T {
    return answer(HTTP.RESET_CONTENT, ...args) as T;
}

export function seeOther<T>(wrapper: Wrapper<T>): T;
export function seeOther<T>(body?: T): T;
export function seeOther<T>(message?: string): T;
export function seeOther<T>(body?: T, message?: string): T;
export function seeOther<T>(...args: any[]): T {
    return answer(HTTP.SEE_OTHER, ...args) as T;
}

export function serviceUnavailable<T>(wrapper: Wrapper<T>): T;
export function serviceUnavailable<T>(body?: T): T;
export function serviceUnavailable<T>(message?: string): T;
export function serviceUnavailable<T>(body?: T, message?: string): T;
export function serviceUnavailable<T>(...args: any[]): T {
    return answer(HTTP.SERVICE_UNAVAILABLE, ...args) as T;
}

export function switchingProtocols<T>(wrapper: Wrapper<T>): T;
export function switchingProtocols<T>(body?: T): T;
export function switchingProtocols<T>(message?: string): T;
export function switchingProtocols<T>(body?: T, message?: string): T;
export function switchingProtocols<T>(...args: any[]): T {
    return answer(HTTP.SWITCHING_PROTOCOLS, ...args) as T;
}

export function temporaryRedirect<T>(wrapper: Wrapper<T>): T;
export function temporaryRedirect<T>(body?: T): T;
export function temporaryRedirect<T>(message?: string): T;
export function temporaryRedirect<T>(body?: T, message?: string): T;
export function temporaryRedirect<T>(...args: any[]): T {
    return answer(HTTP.TEMPORARY_REDIRECT, ...args) as T;
}

export function tooManyRequests<T>(wrapper: Wrapper<T>): T;
export function tooManyRequests<T>(body?: T): T;
export function tooManyRequests<T>(message?: string): T;
export function tooManyRequests<T>(body?: T, message?: string): T;
export function tooManyRequests<T>(...args: any[]): T {
    return answer(HTTP.TOO_MANY_REQUESTS, ...args) as T;
}

export function unauthorized<T>(wrapper: Wrapper<T>): T;
export function unauthorized<T>(body?: T): T;
export function unauthorized<T>(message?: string): T;
export function unauthorized<T>(body?: T, message?: string): T;
export function unauthorized<T>(...args: any[]): T {
    return answer(HTTP.UNAUTHORIZED, ...args) as T;
}

export function unprocessableEntity<T>(wrapper: Wrapper<T>): T;
export function unprocessableEntity<T>(body?: T): T;
export function unprocessableEntity<T>(message?: string): T;
export function unprocessableEntity<T>(body?: T, message?: string): T;
export function unprocessableEntity<T>(...args: any[]): T {
    return answer(HTTP.UNPROCESSABLE_ENTITY, ...args) as T;
}

export function unsupportedMediaType<T>(wrapper: Wrapper<T>): T;
export function unsupportedMediaType<T>(body?: T): T;
export function unsupportedMediaType<T>(message?: string): T;
export function unsupportedMediaType<T>(body?: T, message?: string): T;
export function unsupportedMediaType<T>(...args: any[]): T {
    return answer(HTTP.UNSUPPORTED_MEDIA_TYPE, ...args) as T;
}

export function useProxy<T>(wrapper: Wrapper<T>): T;
export function useProxy<T>(body?: T): T;
export function useProxy<T>(message?: string): T;
export function useProxy<T>(body?: T, message?: string): T;
export function useProxy<T>(...args: any[]): T {
    return answer(HTTP.USE_PROXY, ...args) as T;
}
