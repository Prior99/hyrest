import { Request, Response, NextFunction, Router } from "express";
import { Controller } from "./controller";
import { Route } from "./route";

export function RestRpc(...controllersObjects: Object[]) {
    const controllers = controllersObjects.map(controllerObject => {
        const controller: Controller = Reflect.getMetadata("api:controller", controllerObject);
        if (!controller) {
            const name = controllerObject.constructor.name;
            throw new Error(`Added an object to the RestRpc middleware which is not a @controller. Check ${name}.`);
        }
        return controller;
    });
    const routes: Route[] = controllers.reduce((result, controller) => {
        result.push(...controller.routes);
        return result;
    }, []);

    const router = Router();
    routes.forEach(route => {
        const handler = (request: Request, response: Response) => {
            return;
        };
        switch (route.method) {
            case "GET": router.get(handler);
            case "POST": router.get(handler);
            case "PATCH": router.get(handler);
            case "PUT": router.get(handler);
            case "DELETE": router.get(handler);
            case "HEAD": router.get(handler);
            case "OPTIONS": router.get(handler);
            case "CONNECT": router.get(handler);
            case "TRACE": router.get(handler);
            default: throw new Error(`Unknown HTTP method ${route.method}. Take a look at ${route.property}.`)
        }
    });
    return router;
}
