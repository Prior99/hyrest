import "reflect-metadata";

import * as HTTP from "http-status-codes";
import { setLastCall } from "./last-call";

export type Wrapper<T> = {
    readonly body?: T;
    readonly message?: string;
};

function isWrapper(wrapper: any): wrapper is Wrapper<any> {
    if (typeof wrapper !== "object") {
        return false;
    }
    const keys = Object.keys(wrapper);
    return keys.length > 0 && keys.every(key => ["message", "body"].includes(key));
}

function getWrapper<T>(arg1: T | Wrapper<T> | string, arg2?: string): Wrapper<T> {
    if (typeof arg1 === "undefined") {
        return {};
    }
    if (typeof arg2 === "undefined") {
        if (isWrapper(arg1)) {
            const { message, body } = arg1;
            return {
                message, body,
            };
        }
        if (typeof arg1 === "string") {
            return {
                message: arg1,
            };
        }
        return {
            body: arg1,
        };
    }
    return {
        body: arg1 as T,
        message: arg2,
    };
}

function answer<T>(statusCode: number, arg1: T | Wrapper<T> | string, arg2?: string): T {
    const { message, body } = getWrapper(arg1, arg2);
    setLastCall({ statusCode, message });
    return body;
}

export function accepted<T>(wrapper: Wrapper<T>): T;
export function accepted<T>(body?: T): T;
export function accepted<T>(message?: string): T;
export function accepted<T>(body?: T, message?: string): T;
export function accepted<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.ACCEPTED, arg1, arg2);
}

export function badGateway<T>(wrapper: Wrapper<T>): T;
export function badGateway<T>(body?: T): T;
export function badGateway<T>(message?: string): T;
export function badGateway<T>(body?: T, message?: string): T;
export function badGateway<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.BAD_GATEWAY, arg1, arg2);
}

export function badRequest<T>(wrapper: Wrapper<T>): T;
export function badRequest<T>(body?: T): T;
export function badRequest<T>(message?: string): T;
export function badRequest<T>(body?: T, message?: string): T;
export function badRequest<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.BAD_REQUEST, arg1, arg2);
}

export function conflict<T>(wrapper: Wrapper<T>): T;
export function conflict<T>(body?: T): T;
export function conflict<T>(message?: string): T;
export function conflict<T>(body?: T, message?: string): T;
export function conflict<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.CONFLICT, arg1, arg2);
}

export function httpContinue<T>(wrapper: Wrapper<T>): T;
export function httpContinue<T>(body?: T): T;
export function httpContinue<T>(message?: string): T;
export function httpContinue<T>(body?: T, message?: string): T;
export function httpContinue<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.CONTINUE, arg1, arg2);
}

export function created<T>(wrapper: Wrapper<T>): T;
export function created<T>(body?: T): T;
export function created<T>(message?: string): T;
export function created<T>(body?: T, message?: string): T;
export function created<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.CREATED, arg1, arg2);
}

export function expectationFailed<T>(wrapper: Wrapper<T>): T;
export function expectationFailed<T>(body?: T): T;
export function expectationFailed<T>(message?: string): T;
export function expectationFailed<T>(body?: T, message?: string): T;
export function expectationFailed<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.EXPECTATION_FAILED, arg1, arg2);
}

export function failedDependency<T>(wrapper: Wrapper<T>): T;
export function failedDependency<T>(body?: T): T;
export function failedDependency<T>(message?: string): T;
export function failedDependency<T>(body?: T, message?: string): T;
export function failedDependency<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.FAILED_DEPENDENCY, arg1, arg2);
}

export function forbidden<T>(wrapper: Wrapper<T>): T;
export function forbidden<T>(body?: T): T;
export function forbidden<T>(message?: string): T;
export function forbidden<T>(body?: T, message?: string): T;
export function forbidden<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.FORBIDDEN, arg1, arg2);
}

export function gatewayTimeout<T>(wrapper: Wrapper<T>): T;
export function gatewayTimeout<T>(body?: T): T;
export function gatewayTimeout<T>(message?: string): T;
export function gatewayTimeout<T>(body?: T, message?: string): T;
export function gatewayTimeout<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.GATEWAY_TIMEOUT, arg1, arg2);
}

export function gone<T>(wrapper: Wrapper<T>): T;
export function gone<T>(body?: T): T;
export function gone<T>(message?: string): T;
export function gone<T>(body?: T, message?: string): T;
export function gone<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.GONE, arg1, arg2);
}

export function httpVersionNotSupported<T>(wrapper: Wrapper<T>): T;
export function httpVersionNotSupported<T>(body?: T): T;
export function httpVersionNotSupported<T>(message?: string): T;
export function httpVersionNotSupported<T>(body?: T, message?: string): T;
export function httpVersionNotSupported<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.HTTP_VERSION_NOT_SUPPORTED, arg1, arg2);
}

export function insufficientSpaceOnResource<T>(wrapper: Wrapper<T>): T;
export function insufficientSpaceOnResource<T>(body?: T): T;
export function insufficientSpaceOnResource<T>(message?: string): T;
export function insufficientSpaceOnResource<T>(body?: T, message?: string): T;
export function insufficientSpaceOnResource<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.INSUFFICIENT_SPACE_ON_RESOURCE, arg1, arg2);
}

export function insufficientStorage<T>(wrapper: Wrapper<T>): T;
export function insufficientStorage<T>(body?: T): T;
export function insufficientStorage<T>(message?: string): T;
export function insufficientStorage<T>(body?: T, message?: string): T;
export function insufficientStorage<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.INSUFFICIENT_STORAGE, arg1, arg2);
}

export function internalServerError<T>(wrapper: Wrapper<T>): T;
export function internalServerError<T>(body?: T): T;
export function internalServerError<T>(message?: string): T;
export function internalServerError<T>(body?: T, message?: string): T;
export function internalServerError<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.INTERNAL_SERVER_ERROR, arg1, arg2);
}

export function lengthRequired<T>(wrapper: Wrapper<T>): T;
export function lengthRequired<T>(body?: T): T;
export function lengthRequired<T>(message?: string): T;
export function lengthRequired<T>(body?: T, message?: string): T;
export function lengthRequired<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.LENGTH_REQUIRED, arg1, arg2);
}

export function locked<T>(wrapper: Wrapper<T>): T;
export function locked<T>(body?: T): T;
export function locked<T>(message?: string): T;
export function locked<T>(body?: T, message?: string): T;
export function locked<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.LOCKED, arg1, arg2);
}

export function methodFailure<T>(wrapper: Wrapper<T>): T;
export function methodFailure<T>(body?: T): T;
export function methodFailure<T>(message?: string): T;
export function methodFailure<T>(body?: T, message?: string): T;
export function methodFailure<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.METHOD_FAILURE, arg1, arg2);
}

export function methodNotAllowed<T>(wrapper: Wrapper<T>): T;
export function methodNotAllowed<T>(body?: T): T;
export function methodNotAllowed<T>(message?: string): T;
export function methodNotAllowed<T>(body?: T, message?: string): T;
export function methodNotAllowed<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.METHOD_NOT_ALLOWED, arg1, arg2);
}

export function movedPermanently<T>(wrapper: Wrapper<T>): T;
export function movedPermanently<T>(body?: T): T;
export function movedPermanently<T>(message?: string): T;
export function movedPermanently<T>(body?: T, message?: string): T;
export function movedPermanently<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.MOVED_PERMANENTLY, arg1, arg2);
}

export function movedTemporarily<T>(wrapper: Wrapper<T>): T;
export function movedTemporarily<T>(body?: T): T;
export function movedTemporarily<T>(message?: string): T;
export function movedTemporarily<T>(body?: T, message?: string): T;
export function movedTemporarily<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.MOVED_TEMPORARILY, arg1, arg2);
}

export function multiStatus<T>(wrapper: Wrapper<T>): T;
export function multiStatus<T>(body?: T): T;
export function multiStatus<T>(message?: string): T;
export function multiStatus<T>(body?: T, message?: string): T;
export function multiStatus<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.MULTI_STATUS, arg1, arg2);
}

export function multipleChoices<T>(wrapper: Wrapper<T>): T;
export function multipleChoices<T>(body?: T): T;
export function multipleChoices<T>(message?: string): T;
export function multipleChoices<T>(body?: T, message?: string): T;
export function multipleChoices<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.MULTIPLE_CHOICES, arg1, arg2);
}

export function networkAuthenticationRequired<T>(wrapper: Wrapper<T>): T;
export function networkAuthenticationRequired<T>(body?: T): T;
export function networkAuthenticationRequired<T>(message?: string): T;
export function networkAuthenticationRequired<T>(body?: T, message?: string): T;
export function networkAuthenticationRequired<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.NETWORK_AUTHENTICATION_REQUIRED, arg1, arg2);
}

export function noContent<T>(wrapper: Wrapper<T>): T;
export function noContent<T>(body?: T): T;
export function noContent<T>(message?: string): T;
export function noContent<T>(body?: T, message?: string): T;
export function noContent<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.NO_CONTENT, arg1, arg2);
}

export function nonAuthoritativeInformation<T>(wrapper: Wrapper<T>): T;
export function nonAuthoritativeInformation<T>(body?: T): T;
export function nonAuthoritativeInformation<T>(message?: string): T;
export function nonAuthoritativeInformation<T>(body?: T, message?: string): T;
export function nonAuthoritativeInformation<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.NON_AUTHORITATIVE_INFORMATION, arg1, arg2);
}

export function notAcceptable<T>(wrapper: Wrapper<T>): T;
export function notAcceptable<T>(body?: T): T;
export function notAcceptable<T>(message?: string): T;
export function notAcceptable<T>(body?: T, message?: string): T;
export function notAcceptable<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.NOT_ACCEPTABLE, arg1, arg2);
}

export function notFound<T>(wrapper: Wrapper<T>): T;
export function notFound<T>(body?: T): T;
export function notFound<T>(message?: string): T;
export function notFound<T>(body?: T, message?: string): T;
export function notFound<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.NOT_FOUND, arg1, arg2);
}

export function notImplemented<T>(wrapper: Wrapper<T>): T;
export function notImplemented<T>(body?: T): T;
export function notImplemented<T>(message?: string): T;
export function notImplemented<T>(body?: T, message?: string): T;
export function notImplemented<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.NOT_IMPLEMENTED, arg1, arg2);
}

export function notModified<T>(wrapper: Wrapper<T>): T;
export function notModified<T>(body?: T): T;
export function notModified<T>(message?: string): T;
export function notModified<T>(body?: T, message?: string): T;
export function notModified<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.NOT_MODIFIED, arg1, arg2);
}

export function ok<T>(wrapper: Wrapper<T>): T;
export function ok<T>(body?: T): T;
export function ok<T>(message?: string): T;
export function ok<T>(body?: T, message?: string): T;
export function ok<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.OK, arg1, arg2);
}

export function partialContent<T>(wrapper: Wrapper<T>): T;
export function partialContent<T>(body?: T): T;
export function partialContent<T>(message?: string): T;
export function partialContent<T>(body?: T, message?: string): T;
export function partialContent<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.PARTIAL_CONTENT, arg1, arg2);
}

export function paymentRequired<T>(wrapper: Wrapper<T>): T;
export function paymentRequired<T>(body?: T): T;
export function paymentRequired<T>(message?: string): T;
export function paymentRequired<T>(body?: T, message?: string): T;
export function paymentRequired<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.PAYMENT_REQUIRED, arg1, arg2);
}

export function preconditionFailed<T>(wrapper: Wrapper<T>): T;
export function preconditionFailed<T>(body?: T): T;
export function preconditionFailed<T>(message?: string): T;
export function preconditionFailed<T>(body?: T, message?: string): T;
export function preconditionFailed<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.PRECONDITION_FAILED, arg1, arg2);
}

export function preconditionRequired<T>(wrapper: Wrapper<T>): T;
export function preconditionRequired<T>(body?: T): T;
export function preconditionRequired<T>(message?: string): T;
export function preconditionRequired<T>(body?: T, message?: string): T;
export function preconditionRequired<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.PRECONDITION_REQUIRED, arg1, arg2);
}

export function processing<T>(wrapper: Wrapper<T>): T;
export function processing<T>(body?: T): T;
export function processing<T>(message?: string): T;
export function processing<T>(body?: T, message?: string): T;
export function processing<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.PROCESSING, arg1, arg2);
}

export function proxyAuthenticationRequired<T>(wrapper: Wrapper<T>): T;
export function proxyAuthenticationRequired<T>(body?: T): T;
export function proxyAuthenticationRequired<T>(message?: string): T;
export function proxyAuthenticationRequired<T>(body?: T, message?: string): T;
export function proxyAuthenticationRequired<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.PROXY_AUTHENTICATION_REQUIRED, arg1, arg2);
}

export function requestHeaderFieldsTooLarge<T>(wrapper: Wrapper<T>): T;
export function requestHeaderFieldsTooLarge<T>(body?: T): T;
export function requestHeaderFieldsTooLarge<T>(message?: string): T;
export function requestHeaderFieldsTooLarge<T>(body?: T, message?: string): T;
export function requestHeaderFieldsTooLarge<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.REQUEST_HEADER_FIELDS_TOO_LARGE, arg1, arg2);
}

export function requestTimeout<T>(wrapper: Wrapper<T>): T;
export function requestTimeout<T>(body?: T): T;
export function requestTimeout<T>(message?: string): T;
export function requestTimeout<T>(body?: T, message?: string): T;
export function requestTimeout<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.REQUEST_TIMEOUT, arg1, arg2);
}

export function requestTooLong<T>(wrapper: Wrapper<T>): T;
export function requestTooLong<T>(body?: T): T;
export function requestTooLong<T>(message?: string): T;
export function requestTooLong<T>(body?: T, message?: string): T;
export function requestTooLong<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.REQUEST_TOO_LONG, arg1, arg2);
}

export function requestUriTooLong<T>(wrapper: Wrapper<T>): T;
export function requestUriTooLong<T>(body?: T): T;
export function requestUriTooLong<T>(message?: string): T;
export function requestUriTooLong<T>(body?: T, message?: string): T;
export function requestUriTooLong<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.REQUEST_URI_TOO_LONG, arg1, arg2);
}

export function requestedRangeNotSatisfiable<T>(wrapper: Wrapper<T>): T;
export function requestedRangeNotSatisfiable<T>(body?: T): T;
export function requestedRangeNotSatisfiable<T>(message?: string): T;
export function requestedRangeNotSatisfiable<T>(body?: T, message?: string): T;
export function requestedRangeNotSatisfiable<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.REQUESTED_RANGE_NOT_SATISFIABLE, arg1, arg2);
}

export function resetContent<T>(wrapper: Wrapper<T>): T;
export function resetContent<T>(body?: T): T;
export function resetContent<T>(message?: string): T;
export function resetContent<T>(body?: T, message?: string): T;
export function resetContent<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.RESET_CONTENT, arg1, arg2);
}

export function seeOther<T>(wrapper: Wrapper<T>): T;
export function seeOther<T>(body?: T): T;
export function seeOther<T>(message?: string): T;
export function seeOther<T>(body?: T, message?: string): T;
export function seeOther<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.SEE_OTHER, arg1, arg2);
}

export function serviceUnavailable<T>(wrapper: Wrapper<T>): T;
export function serviceUnavailable<T>(body?: T): T;
export function serviceUnavailable<T>(message?: string): T;
export function serviceUnavailable<T>(body?: T, message?: string): T;
export function serviceUnavailable<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.SERVICE_UNAVAILABLE, arg1, arg2);
}

export function switchingProtocols<T>(wrapper: Wrapper<T>): T;
export function switchingProtocols<T>(body?: T): T;
export function switchingProtocols<T>(message?: string): T;
export function switchingProtocols<T>(body?: T, message?: string): T;
export function switchingProtocols<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.SWITCHING_PROTOCOLS, arg1, arg2);
}

export function temporaryRedirect<T>(wrapper: Wrapper<T>): T;
export function temporaryRedirect<T>(body?: T): T;
export function temporaryRedirect<T>(message?: string): T;
export function temporaryRedirect<T>(body?: T, message?: string): T;
export function temporaryRedirect<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.TEMPORARY_REDIRECT, arg1, arg2);
}

export function tooManyRequests<T>(wrapper: Wrapper<T>): T;
export function tooManyRequests<T>(body?: T): T;
export function tooManyRequests<T>(message?: string): T;
export function tooManyRequests<T>(body?: T, message?: string): T;
export function tooManyRequests<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.TOO_MANY_REQUESTS, arg1, arg2);
}

export function unauthorized<T>(wrapper: Wrapper<T>): T;
export function unauthorized<T>(body?: T): T;
export function unauthorized<T>(message?: string): T;
export function unauthorized<T>(body?: T, message?: string): T;
export function unauthorized<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.UNAUTHORIZED, arg1, arg2);
}

export function unprocessableEntity<T>(wrapper: Wrapper<T>): T;
export function unprocessableEntity<T>(body?: T): T;
export function unprocessableEntity<T>(message?: string): T;
export function unprocessableEntity<T>(body?: T, message?: string): T;
export function unprocessableEntity<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.UNPROCESSABLE_ENTITY, arg1, arg2);
}

export function unsupportedMediaType<T>(wrapper: Wrapper<T>): T;
export function unsupportedMediaType<T>(body?: T): T;
export function unsupportedMediaType<T>(message?: string): T;
export function unsupportedMediaType<T>(body?: T, message?: string): T;
export function unsupportedMediaType<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.UNSUPPORTED_MEDIA_TYPE, arg1, arg2);
}

export function useProxy<T>(wrapper: Wrapper<T>): T;
export function useProxy<T>(body?: T): T;
export function useProxy<T>(message?: string): T;
export function useProxy<T>(body?: T, message?: string): T;
export function useProxy<T>(arg1: T | string | Wrapper<T>, arg2?: string): T {
    return answer(HTTP.USE_PROXY, arg1, arg2);
}
