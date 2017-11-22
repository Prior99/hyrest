import "reflect-metadata";

import { HTTPMethod } from "./http-method";
import { Params } from "./parameters";
import { ControllerMode, Controller } from "./controller";

export interface RouteOptions {

}

export interface Route {
    readonly target: Object;
    readonly property: string;
    readonly method: HTTPMethod;
    readonly url: string;
    readonly options?: RouteOptions;
}

function getRoutes(target: Object): Route[] {
    const routes = Reflect.getMetadata("api:routes", target);
    if (routes) {
        return routes;
    }
    const newRoutes: Route[] = [];
    Reflect.defineMetadata("api:routes", newRoutes, target);
    return newRoutes;
}

export function route(method: HTTPMethod, url: string, options?: RouteOptions): MethodDecorator {
    return (target: Object, property: string, descriptor: PropertyDescriptor) => {
        const routeMeta = { target, property, method, url, options };
        const routes = getRoutes(target);
        routes.push(routeMeta);
        const originalFunction = descriptor.value;
        descriptor.value = function (parameters: Params, body: any, query: Params) {
            const controller: Controller = Reflect.getMetadata("api:controller", target.constructor);
            if (!controller) {
                const name = target.constructor.name;
                throw new Error(`Found @route on a class without @controller. Take a look at ${name}.`);
            }
            if (controller.mode === ControllerMode.CLIENT) {
                return controller.wrappedFetch(routeMeta, parameters, body, query);
            }
            return originalFunction(parameters, body, query);
        };
        return descriptor;
    };
}
