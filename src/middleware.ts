import { Request, Response, NextFunction, Router } from "express";
import { Controller } from "./controller";
import { Route } from "./route";
import { WrappedAnswer, internalServerError } from "./answers";
import {
    QueryParameter,
    BodyParameter,
    UrlParameter,
    getBodyParameters,
    getQueryParameters,
    getUrlParameters,
} from "./parameter-decorators";

interface RouteConfiguration {
    readonly route: Route;
    readonly queryParameters: QueryParameter[];
    readonly bodyParameters: BodyParameter[];
    readonly urlParameters: UrlParameter[];
}

export function restRpc(...controllerObjects: Object[]): Router {
    const routes: RouteConfiguration[] = controllerObjects
        .reduce((result: RouteConfiguration[], controllerObject) => {
            const controllerRoutes: Route[] = Reflect.getMetadata("api:routes", controllerObject);
            if (controllerRoutes) {
                result.push(...controllerRoutes.map(route => ({
                    route,
                    queryParameters: getQueryParameters(controllerObject, route.property),
                    bodyParameters: getBodyParameters(controllerObject, route.property),
                    urlParameters: getUrlParameters(controllerObject, route.property),
                })));
            }
            return result;
        }, []) as RouteConfiguration[];
    const controllers = controllerObjects.map(controllerObject => {
        const controller: Controller = Reflect.getMetadata("api:controller", controllerObject.constructor);
        if (!controller) {
            const name = controllerObject.constructor.name;
            throw new Error(`Added an object to the RestRpc middleware which is not a @controller. Check ${name}.`);
        }
        return controller;
    });

    const router = Router();
    routes.forEach(({ route, queryParameters, bodyParameters, urlParameters }) => {
        const routeMethod = (route.target as any)[route.property];
        const handler = async (request: Request, response: Response) => {
            let answer: WrappedAnswer<any>;
            try {
                const args: any[] = [];
                queryParameters.forEach(({ index, name }) => { args[index] = request.query[name]; });
                bodyParameters.forEach(({ index }) => { args[index] = request.body; });
                urlParameters.forEach(({ index, name }) => { args[index] = request.params[name]; });
                answer = await routeMethod(...args);
            } catch (err) {
                console.error(err);
                answer = internalServerError();
            }
            const { statusCode, result } = answer;
            response.status(statusCode).send(result);
            return;
        };
        switch (route.method) {
            case "GET": router.get(route.url, handler); break;
            case "POST": router.post(route.url, handler); break;
            case "PATCH": router.patch(route.url, handler); break;
            case "PUT": router.put(route.url, handler); break;
            case "DELETE": router.delete(route.url, handler); break;
            case "HEAD": router.head(route.url, handler); break;
            case "OPTIONS": router.options(route.url, handler); break;
            case "CONNECT": router.connect(route.url, handler); break;
            case "TRACE": router.trace(route.url, handler); break;
            default: throw new Error(`Unknown HTTP method ${route.method}. Take a look at ${route.property}.`);
        }
    });
    return router;
}
