import "reflect-metadata";
import { Controller, ControllerOptions } from "./controller";

/**
 * Configures the class of a specific controller with the specified options.
 * The first argument takes the class of the controller to configure. **It does not take
 * the instance of a controller.**
 *
 * @param controllerClass The class of the controller to configure. Can also be an array of controllers.
 * @param options The options with which the controller specified in the first argument should be configured.
 */
export function configureController(controllerClass: Function | Function[], options: ControllerOptions) {
    if (Array.isArray(controllerClass)) {
        controllerClass.forEach(single => configureController(single, options));
        return;
    }
    const controller: Controller = Reflect.getMetadata("api:controller", controllerClass);
    if (!controller) {
        const name = controllerClass.name;
        throw new Error(`Tried to configure an object which is not a @controller. Check ${name}.`);
    }
    controller.configure(options);
}
