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
export function hyrest(...controllerObjects: any[]): Router {
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

    const router = Router();
    routes.forEach(({ route, queryParameters, bodyParameters, urlParameters, controllerObject }) => {
        // Grab the actual method from the instance and the route's property name.
        const routeMethod = (route.target as any)[route.property];

        // This handler will be called for every request passing through this middleware.
        const handler = async (request: Request, response: Response) => {
            // Prepare the arguments to pass into the call to the route based on the parameter inejctions.
            const args: any[] = [];
            queryParameters.forEach(({ index, name }) => { args[index] = request.query[name]; });
            bodyParameters.forEach(({ index }) => { args[index] = request.body; });
            urlParameters.forEach(({ index, name }) => { args[index] = request.params[name]; });

            let data: any;

            // Validate and convert all values,
            const processed = await Promise.all(args.map((arg, index) => {
                const options = getParameterValidation(route.target, route.property, index);
                const factoryValidators = options.validatorFactory ? options.validatorFactory(controllerObject) : [];
                const validators = [ ...options.validators, ...factoryValidators ];
                return processValue(arg, options.converter, validators);
            }));

            // If an error occured, answer with `unprocessableEntity`.
            const errors = processed.reduce((result, current) => {
                result.push(...current.errors);
                return result;
            }, []);
            if (errors.length > 0) {
                data = unprocessableEntity(errors[0]);
            } else {
                try {
                    data = await routeMethod.apply(controllerObject, processed.map(result => result.value));
                } catch (err) {
                    console.error(err);
                    data = internalServerError();
                }
            }

            // Respond to the request with the given status code and body.
            const { statusCode, message } = consumeLastCall();
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
    return router;
}
