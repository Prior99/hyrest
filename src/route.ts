import { HTTPMethod } from "./http-method";
import { Parameters } from "./parameters";
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

export function route(method: HTTPMethod, url: string, options: RouteOptions): MethodDecorator {
    return (target: Object, property: string, descriptor: PropertyDescriptor) => {
        const controller: Controller = Reflect.getMetadata("api:controller", target);
        if (!controller) {
            const name = target.constructor.name;
            throw new Error(`Found @route on a class without @controller. Take a look at ${name}.`);
        }
        const routeMeta = { target, property, method, url, options };
        controller.addRoute(routeMeta);

        if (controller.mode === ControllerMode.CLIENT) {
            descriptor.value = function (parameters: Parameters, body: any) {
                return controller.wrappedFetch(routeMeta, parameters, body);
            };
            return descriptor;
        }
    };
}
