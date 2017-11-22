import { isBrowser } from "./is-browser";
import { HTTPMethod } from "./http-method";
import { Parameters } from "./parameters";
import { Controller } from "./controller";

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
    let routes = Reflect.getMetadata("api:routes", target);
    if (!routes) {
        routes = [];
        Reflect.defineMetadata("api:routes", routes, target);
    }
    return routes;
}

export function route(method: HTTPMethod, url: string, options: RouteOptions): MethodDecorator {
    return (target: Object, property: string, descriptor: PropertyDescriptor) => {
        if (!(target instanceof Controller)) {
            throw new Error("Can only decorate methods of a class extending `Controller` as routes.");
        }
        const routes = getRoutes(target);
        const routeMeta = { target, property, method, url, options };
        routes.push(routeMeta);

        if (isBrowser()) {
            descriptor.value = function (parameters: Parameters, body: any) {
                return target.wrappedFetch(routeMeta, parameters, body);
            };
            return descriptor;
        }
    };
}
