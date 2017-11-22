import { Controller, ControllerOptions } from "./controller";

export function configureRPC(controllerObject: Function, options: ControllerOptions) {
    const controller: Controller = Reflect.getMetadata("api:controller", controllerObject);
    if (!controller) {
        const name = controllerObject.name;
        throw new Error(`Tried to configure an object which is not a @controller. Check ${name}.`);
    }
    controller.configure(options);
}
