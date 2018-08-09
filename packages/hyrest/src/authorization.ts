import "reflect-metadata";
import { Controller } from "./controller";

export enum AuthorizationMode {
    AUTH = "authorized",
    NOAUTH = "unauthorized",
}

export interface FullAuthorizationOptions<TContext, TRequest> extends AuthorizationOptions<TContext, TRequest> {
    mode: AuthorizationMode;
}

export type AuthorizationChecker<TContext, TRequest> =
    (request?: TRequest, context?: TContext) => Promise<boolean> | boolean;

export interface AuthorizationOptions<TRequest, TContext> {
    /**
     * An additional check to perform for this individual route.
     */
    check?: AuthorizationChecker<TRequest, TContext>;
}

function configureAuthorization<T extends Function, TContext, TRequest>(
    arg1: AuthorizationOptions<TContext, TRequest> | T | Object,
    arg2?: string | symbol,
    arg3?: PropertyDescriptor,
    mode?: AuthorizationMode,
): ClassDecorator | MethodDecorator | T {
    const options: AuthorizationOptions<TContext, TRequest> = typeof arg1 === "object" ? arg1 : {};
    const fullOptions: FullAuthorizationOptions<TContext, TRequest> = { ...options, mode };

    const decorator = function(target: T, property?: string | symbol, descriptor?: PropertyDescriptor): T {
        Reflect.defineMetadata("api:authorization", fullOptions, target, property);
        return;
    };

    if (typeof arg1 === "function") {
        return decorator(arg1 as T);
    }
    if (typeof arg2 !== "undefined" && typeof arg3 !== "undefined") {
        return decorator(arg1 as T, arg2, arg3);
    }
    return decorator as ClassDecorator;
}

export function auth<TContext, TRequest>(options?: AuthorizationOptions<TContext, TRequest>):
    (target: Object | Function, property?: string, descriptor?: PropertyDescriptor) => void;
export function auth<T extends Function>(target: T): T;
export function auth(target: Object, property: string, descriptor: PropertyDescriptor): void;
/**
 * Decorate a route or whole controller to require authentication.
 * An object containing options can be passed.
 * Can be used as a method or class decorator.
 *
 * @param arg1 The options object, a class or a method to decorate. If options are passed,
 *             a decorator is returned. Otherwise this function is a decorator itself.
 *
 * @return A decorator if options were passed.
 */
export function auth<T extends Function, TContext, TRequest>(
    arg1: AuthorizationOptions<TContext, TRequest> | T | Object,
    arg2?: string | symbol,
    arg3?: PropertyDescriptor,
): ClassDecorator | MethodDecorator | T {
    return configureAuthorization<T, TContext, TRequest>(arg1, arg2, arg3, AuthorizationMode.AUTH);
}

export function noauth<TContext>():
    (target: Object | Function, property?: string, descriptor?: PropertyDescriptor) => void;
export function noauth<T extends Function>(target: T): T;
export function noauth(target: Object, property: string, descriptor: PropertyDescriptor): void;
/**
 * Decorate a route or whole controller to not require authentication.
 * Can be used as a method or class decorator.
 *
 * @param arg1 Nothing, a class or a method to decorate. If nothing is passed,
 *             a decorator is returned. Otherwise this function is a decorator itself.
 *
 * @return A decorator if nothing was passed as a first argument.
 */
export function noauth<T extends Function, TContext, TRequest>(
    arg1?: AuthorizationOptions<TContext, TRequest> | T | Object,
    arg2?: string | symbol,
    arg3?: PropertyDescriptor,
): ClassDecorator | MethodDecorator | T {
    return configureAuthorization<T, TContext, TRequest>(arg1 || {}, arg2, arg3, AuthorizationMode.NOAUTH);
}

export function getAuthorization<T extends Object, TContext, TRequest>(
    target: T,
    property: keyof T,
): FullAuthorizationOptions<TContext, TRequest> {
    const routeAuthorization = Reflect.getMetadata("api:authorization", target, property as string | symbol);
    if (typeof routeAuthorization !== "undefined") {
        return routeAuthorization;
    }
    const classAuthorization = Reflect.getMetadata("api:authorization", target.constructor);
    if (typeof classAuthorization !== "undefined") {
        return classAuthorization;
    }
}
