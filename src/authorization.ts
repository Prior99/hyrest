import { Controller } from "./controller";
import { Request } from "express";

export enum AuthorizationMode {
    AUTHORIZED = "authorized",
    UNAUTHORIZED = "unauthorized",
}

export interface FullAuthorizationOptions<T> extends AuthorizationOptions<T> {
    mode: AuthorizationMode;
}

export type AuthorizationChecker<T> = (request?: Request, context?: T) => Promise<boolean> | boolean;

export interface AuthorizationOptions<T> {
    /**
     * An additional check to perform for this individual route.
     */
    check?: AuthorizationChecker<T>;
}

function configureAuthorization<T extends Function, TContext>(
    arg1: AuthorizationOptions<TContext> | T, authorizationMode: AuthorizationMode,
): ClassDecorator | MethodDecorator | T {
    const options: AuthorizationOptions<TContext> = typeof arg1 === "object" ? arg1 : {};
    const fullOptions: FullAuthorizationOptions<TContext> = { ...options, mode: AuthorizationMode.UNAUTHORIZED };
    const decorator = function(target: T, property?: string | symbol, descriptor?: PropertyDescriptor): T {
        Reflect.defineMetadata("api:authorization", fullOptions, target, property);
        return target;
    };
    if (typeof arg1 === "function") {
        return decorator(arg1 as T);
    }
    return decorator as ClassDecorator;
}

export function authorized<T extends Function, TContext>(options?: AuthorizationOptions<TContext>): ClassDecorator;
export function authorized<T extends Function, TContext>(options?: AuthorizationOptions<TContext>): MethodDecorator;
export function authorized<T extends Function>(target: T): T;
export function authorized(target: Object, property: string, descriptor: PropertyDescriptor): void;
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
export function authorized<T extends Function, TContext>(
    arg1: AuthorizationOptions<TContext> | T,
): ClassDecorator | MethodDecorator | T {
    return configureAuthorization<T, TContext>(arg1, AuthorizationMode.AUTHORIZED);
}

export function unauthorized<T extends Function, TContext>(): ClassDecorator;
export function unauthorized<T extends Function, TContext>(): MethodDecorator;
export function unauthorized<T extends Function>(target: T): T;
export function unauthorized(target: Object, property: string, descriptor: PropertyDescriptor): void;
/**
 * Decorate a route or whole controller to not require authentication.
 * Can be used as a method or class decorator.
 *
 * @param arg1 Nothing, a class or a method to decorate. If nothing is passed,
 *             a decorator is returned. Otherwise this function is a decorator itself.
 *
 * @return A decorator if nothing was passed as a first argument.
 */
export function unauthorized<T extends Function, TContext>(
    arg1?: AuthorizationOptions<TContext>,
): ClassDecorator | MethodDecorator | T {
    return configureAuthorization<T, TContext>(arg1 || {}, AuthorizationMode.UNAUTHORIZED);
}

export function getAuthorization<T>(target: Object, property: string | symbol): FullAuthorizationOptions<T> {
    const routeAuthorization = Reflect.getMetadata("api:authorization", target, property);
    if (typeof routeAuthorization !== "undefined") {
        return routeAuthorization;
    }
    const classAuthorization = Reflect.getMetadata("api:authorization", target.constructor);
    if (typeof classAuthorization !== "undefined") {
        return classAuthorization;
    }
    const controller: Controller = Reflect.getMetadata("api:controller", target.constructor);
    if (typeof controller !== "undefined") {
        return { mode: controller.authorizationMode };
    }
}
