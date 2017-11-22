import * as HTTP from "http-status-codes";

export interface Answer<T> {
    message?: string;
    data?: T;
}

export interface WrappedAnswer<T> {
    statusCode: number;
    result: Answer<T>;
}

export function accepted<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.ACCEPTED,
        result: {
            message,
            data: body,
        },
    };
}

export function badGateway<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.BAD_GATEWAY,
        result: {
            message,
            data: body,
        },
    };
}

export function badRequest<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.BAD_REQUEST,
        result: {
            message,
            data: body,
        },
    };
}

export function conflict<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.CONFLICT,
        result: {
            message,
            data: body,
        },
    };
}

export function httpContinue<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.CONTINUE,
        result: {
            message,
            data: body,
        },
    };
}

export function created<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.CREATED,
        result: {
            message,
            data: body,
        },
    };
}

export function expectationFailed<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.EXPECTATION_FAILED,
        result: {
            message,
            data: body,
        },
    };
}

export function failedDependency<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.FAILED_DEPENDENCY,
        result: {
            message,
            data: body,
        },
    };
}

export function forbidden<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.FORBIDDEN,
        result: {
            message,
            data: body,
        },
    };
}

export function gatewayTimeout<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.GATEWAY_TIMEOUT,
        result: {
            message,
            data: body,
        },
    };
}

export function gone<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.GONE,
        result: {
            message,
            data: body,
        },
    };
}

export function httpVersionNotSupported<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.HTTP_VERSION_NOT_SUPPORTED,
        result: {
            message,
            data: body,
        },
    };
}

export function insufficientSpaceOnResource<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.INSUFFICIENT_SPACE_ON_RESOURCE,
        result: {
            message,
            data: body,
        },
    };
}

export function insufficientStorage<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.INSUFFICIENT_STORAGE,
        result: {
            message,
            data: body,
        },
    };
}

export function internalServerError<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.INTERNAL_SERVER_ERROR,
        result: {
            message,
            data: body,
        },
    };
}

export function lengthRequired<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.LENGTH_REQUIRED,
        result: {
            message,
            data: body,
        },
    };
}

export function locked<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.LOCKED,
        result: {
            message,
            data: body,
        },
    };
}

export function methodFailure<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.METHOD_FAILURE,
        result: {
            message,
            data: body,
        },
    };
}

export function methodNotAllowed<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.METHOD_NOT_ALLOWED,
        result: {
            message,
            data: body,
        },
    };
}

export function movedPermanently<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.MOVED_PERMANENTLY,
        result: {
            message,
            data: body,
        },
    };
}

export function movedTemporarily<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.MOVED_TEMPORARILY,
        result: {
            message,
            data: body,
        },
    };
}

export function multiStatus<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.MULTI_STATUS,
        result: {
            message,
            data: body,
        },
    };
}

export function multipleChoices<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.MULTIPLE_CHOICES,
        result: {
            message,
            data: body,
        },
    };
}

export function networkAuthenticationRequired<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.NETWORK_AUTHENTICATION_REQUIRED,
        result: {
            message,
            data: body,
        },
    };
}

export function noContent<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.NO_CONTENT,
        result: {
            message,
            data: body,
        },
    };
}

export function nonAuthoritativeInformation<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.NON_AUTHORITATIVE_INFORMATION,
        result: {
            message,
            data: body,
        },
    };
}

export function notAcceptable<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.NOT_ACCEPTABLE,
        result: {
            message,
            data: body,
        },
    };
}

export function notFound<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.NOT_FOUND,
        result: {
            message,
            data: body,
        },
    };
}

export function notImplemented<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.NOT_IMPLEMENTED,
        result: {
            message,
            data: body,
        },
    };
}

export function notModified<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.NOT_MODIFIED,
        result: {
            message,
            data: body,
        },
    };
}

export function ok<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.OK,
        result: {
            message,
            data: body,
        },
    };
}

export function partialContent<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.PARTIAL_CONTENT,
        result: {
            message,
            data: body,
        },
    };
}

export function paymentRequired<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.PAYMENT_REQUIRED,
        result: {
            message,
            data: body,
        },
    };
}

export function preconditionFailed<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.PRECONDITION_FAILED,
        result: {
            message,
            data: body,
        },
    };
}

export function preconditionRequired<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.PRECONDITION_REQUIRED,
        result: {
            message,
            data: body,
        },
    };
}

export function processing<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.PROCESSING,
        result: {
            message,
            data: body,
        },
    };
}

export function proxyAuthenticationRequired<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.PROXY_AUTHENTICATION_REQUIRED,
        result: {
            message,
            data: body,
        },
    };
}

export function requestHeaderFieldsTooLarge<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.REQUEST_HEADER_FIELDS_TOO_LARGE,
        result: {
            message,
            data: body,
        },
    };
}

export function requestTimeout<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.REQUEST_TIMEOUT,
        result: {
            message,
            data: body,
        },
    };
}

export function requestTooLong<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.REQUEST_TOO_LONG,
        result: {
            message,
            data: body,
        },
    };
}

export function requestUriTooLong<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.REQUEST_URI_TOO_LONG,
        result: {
            message,
            data: body,
        },
    };
}

export function requestedRangeNotSatisfiable<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.REQUESTED_RANGE_NOT_SATISFIABLE,
        result: {
            message,
            data: body,
        },
    };
}

export function resetContent<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.RESET_CONTENT,
        result: {
            message,
            data: body,
        },
    };
}

export function seeOther<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.SEE_OTHER,
        result: {
            message,
            data: body,
        },
    };
}

export function serviceUnavailable<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.SERVICE_UNAVAILABLE,
        result: {
            message,
            data: body,
        },
    };
}

export function switchingProtocols<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.SWITCHING_PROTOCOLS,
        result: {
            message,
            data: body,
        },
    };
}

export function temporaryRedirect<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.TEMPORARY_REDIRECT,
        result: {
            message,
            data: body,
        },
    };
}

export function tooManyRequests<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.TOO_MANY_REQUESTS,
        result: {
            message,
            data: body,
        },
    };
}

export function unauthorized<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.UNAUTHORIZED,
        result: {
            message,
            data: body,
        },
    };
}

export function unprocessableEntity<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.UNPROCESSABLE_ENTITY,
        result: {
            message,
            data: body,
        },
    };
}

export function unsupportedMediaType<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.UNSUPPORTED_MEDIA_TYPE,
        result: {
            message,
            data: body,
        },
    };
}

export function useProxy<T>(body?: T, message?: string): WrappedAnswer<T> {
    return {
        statusCode: HTTP.USE_PROXY,
        result: {
            message,
            data: body,
        },
    };
}
