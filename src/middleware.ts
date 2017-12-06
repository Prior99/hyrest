import { Request, Response, NextFunction, Router } from "express";
import { Controller } from "./controller";
import { Route, getRoutes } from "./route";
import { internalServerError, unprocessableEntity } from "./answers";
import { consumeLastCall } from "./last-call";
import {
    QueryParameter,
    BodyParameter,
    UrlParameter,
    getBodyParameters,
    getQueryParameters,
    getUrlParameters,
} from "./parameters";
import { getParameterValidation, processValue } from "./validation";
import { Converter } from "./converters";
import { Processed } from "./processed";
import { populate, dump } from "./scope";
import { getTransforms } from "./transform";
import { AuthorizationMode, getAuthorization, AuthorizationChecker } from "./authorization";
import * as HTTP from "http-status-codes";

/**
 * A wrapper around a `Route` which also carries the Route's parameter injections.
 */
interface RouteConfiguration {
    readonly route: Route;
    readonly queryParameters: QueryParameter[];
    readonly bodyParameters: BodyParameter[];
    readonly urlParameters: UrlParameter[];
    readonly controllerObject: Object;
}

/**
 * Assembles a list of all routes of all specified controllers with their parameter injections.
 *
 * @param controllerObjects A list of all controllers to assemble the list of routes from.
 *
 * @return An array of all routes present on all supplied controllers.
 */
function listRoutes(controllerObjects: any[]): RouteConfiguration[] {
    return controllerObjects.reduce((result, controllerObject) => {
        // Fetch all routes from this particular controller and put the parameter injections next to tehm.
        const routes = getRoutes(controllerObject).map(route => ({
            route,
            queryParameters: getQueryParameters(controllerObject, route.property),
            bodyParameters: getBodyParameters(controllerObject, route.property),
            urlParameters: getUrlParameters(controllerObject, route.property),
            controllerObject,
        }));
        result.push(...routes);
        return result;
    }, []);
}

export type HyrestMiddleware<T> = Router & HyrestBuilder<T>;

export interface HyrestBuilder<T> {
    context: (contextObject: T) => HyrestMiddleware<T>;
    authorization: (handler: AuthorizationChecker<T>) => HyrestMiddleware<T>;
    defaultAuthorizationMode: (mode: AuthorizationMode) => HyrestMiddleware<T>;
}

/**
 * A middleware to use with express. Takes a list of controllers as arguments. All controllers will be attached
 * to react and will receive requests.
 *
 * **Example:**
 * ```
 * app.use(resRpc(new ControllerOne(), new ControllerTwo(), ...));
 * ```
 *
 * @param controllerObjects The instances of controllers to pass express's requests to.
 *
 * @return An express router.
 */
export function hyrest<TContext>(...controllerObjects: any[]): HyrestMiddleware<TContext> {
    let context: TContext;
    let defaultAuthorizationMode = AuthorizationMode.UNAUTHORIZED;
    let authorizationCheck: AuthorizationChecker<TContext>;
    // Get the actual `Controller` instances for each @controller decorated object.
    // Throws an error if an instance of a class not decorated with @controller has been passed.
    const controllers = controllerObjects.map(controllerObject => {
        const controller: Controller = Reflect.getMetadata("api:controller", controllerObject.constructor);
        if (!controller) {
            const name = controllerObject.constructor.name;
            throw new Error(`Added an object to the Hyrest middleware which is not a @controller. Check ${name}.`);
        }
        return controller;
    });

    // Get a flat list of all routes present on all controllers.
    const routes: RouteConfiguration[] = listRoutes(controllerObjects);

    const router: HyrestMiddleware<TContext> = Router() as any;
    routes.forEach(({ route, queryParameters, bodyParameters, urlParameters, controllerObject }) => {
        // Grab the actual method from the instance and the route's property name.
        const routeMethod = (route.target as any)[route.property];

        // This handler will be called for every request passing through this middleware.
        const handler = async (request: Request, response: Response) => {
            // Check whether the call was authorized.
            const authorizationOptions = getAuthorization(route.target, route.property);
            const authorizationMode = authorizationOptions ? authorizationOptions.mode : defaultAuthorizationMode;
            if (authorizationMode === AuthorizationMode.AUTHORIZED) {
                if (typeof authorizationCheck !== "function") {
                    throw new Error("Call to an authorized route but no authorization check was provided.");
                }
                const authorized = await authorizationCheck(request, context);
                const extraCheck = typeof (authorizationOptions && authorizationOptions.check) !== "undefined" ?
                    await authorizationOptions.check(request, context) : true;
                if (!authorized || !extraCheck) {
                    response.status(HTTP.UNAUTHORIZED).send({ message: "Unauthorized." });
                    return;
                }
            }

            // Prepare the arguments to pass into the call to the route based on the parameter inejctions.
            const args: any[] = [];
            queryParameters.forEach(({ index, name }) => { args[index] = request.query[name]; });
            bodyParameters.forEach(({ index }) => { args[index] = request.body; });
            urlParameters.forEach(({ index, name }) => { args[index] = request.params[name]; });

            let data: any;

            // Validate and convert all values,
            const processed: Processed<any>[] = [];
            const queryErrors: { [key: string]: Processed<any> } = {};
            let bodyError: Processed<any>;
            const paramErrors: { [key: string]: Processed<any> } = {};
            let errorEncountered = false;
            await Promise.all(args.map(async (arg, index) => {
                const { fullValidator } = getParameterValidation(route.target, route.property, index);
                const validationResult = fullValidator ?
                    await fullValidator(arg, { context }) :
                    new Processed({ value: arg });

                processed[index] = validationResult;
                if (!validationResult.hasErrors) {
                    return;
                }
                errorEncountered = true;
                // Argument can only either be ...
                if (bodyParameters.find(param => param.index === index)) {
                    // ... an injected body.
                    bodyError = validationResult;
                    return;
                }
                const queryParameter = queryParameters.find(param => param.index === index);
                if (queryParameter) {
                    // ... an injected query parameter.
                    queryErrors[queryParameter.name] = validationResult;
                    return;
                }
                // ... or an injected url parameter.
                const urlParameter = urlParameters.find(param => param.index === index);
                paramErrors[urlParameter.name] = validationResult;
            }));

            if (errorEncountered) {
                data = unprocessableEntity({
                    url: Object.keys(paramErrors).length > 0 ? paramErrors : undefined,
                    body: bodyError,
                    query: Object.keys(queryErrors).length > 0 ? queryErrors : undefined,
                }, "Validation failed.");
            } else {
                try {
                    const transformOptions = getTransforms(route.target, route.property);
                    const processedArgs = processed.map((result, index) => {
                        const bodyParameter = bodyParameters.find(param => param.index === index);
                        const autoPopulate = bodyParameter &&
                            typeof bodyParameter.scope !== "undefined" &&
                            typeof bodyParameter.paramType !== "undefined";
                        if (autoPopulate) {
                            return populate(bodyParameter.scope, bodyParameter.paramType, result.value);
                        }
                        const parameterTranform = transformOptions.parameterTransforms.get(index);
                        if (parameterTranform) {
                            return parameterTranform(result.value);
                        }
                        return result.value;
                    });
                    const routeResult = await routeMethod.apply(controllerObject, processedArgs);
                    if (typeof route.scope !== "undefined" && typeof route.returnType !== "undefined") {
                        data = dump(route.scope, routeResult);
                    } else {
                        data = routeResult;
                    }
                } catch (err) {
                    console.error(err);
                    data = internalServerError();
                }
            }

            // Respond to the request with the given status code and body.
            const lastCall = consumeLastCall();
            if (typeof lastCall === "undefined") {
                throw new Error("Route did not return an answer. Make sure the return value is wrapped properly.");
            }
            const { statusCode, message } = lastCall;
            response.status(statusCode).send({ data, message });
            return;
        };

        // Depending on the HTTP method of the route, make the router listen to the given url and have it
        // call `handler` for each request.
        switch (route.method) {
            case "GET": router.get(route.url, handler); break;
            case "POST": router.post(route.url, handler); break;
            case "PATCH": router.patch(route.url, handler); break;
            case "PUT": router.put(route.url, handler); break;
            case "DELETE": router.delete(route.url, handler); break;
            case "HEAD": router.head(route.url, handler); break;
            case "OPTIONS": router.options(route.url, handler); break;
            case "TRACE": router.trace(route.url, handler); break;
            default: throw new Error(`Unknown HTTP method ${route.method}. Take a look at ${route.property}.`);
        }
    });
    router.context = (newContext: TContext) => {
        context = newContext;
        return router;
    };
    router.authorization = (checker: AuthorizationChecker<TContext>) => {
        authorizationCheck = checker;
        return router;
    };
    router.defaultAuthorizationMode = (defaultMode: AuthorizationMode) => {
        defaultAuthorizationMode = defaultMode;
        return router;
    };
    return router as (Router & HyrestBuilder<TContext>);
}
