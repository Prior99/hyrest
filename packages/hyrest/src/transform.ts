import "reflect-metadata";

export type Transformer<T, U> = (input: T) => U;

/**
 * A set of transformers for a property and it's parameters.
 */
export interface TransformOptions {
    /**
     * The transformer for the proeprty itself.
     */
    propertyTransform?: Transformer<any, any>;
    /**
     * A map of `paramter index` -> `transformer for that paramter`.
     */
    parameterTransforms?: Map<number,Transformer<any, any>>;
}

/**
 * Returns a list of parameters and proeprties decorated to be transformed before populating / injecting.
 * This function is always guaranteed to return an options object.
 *
 * @param target The class on which the method for which the decorated parameters should be retrieved exists.
 * @param propertyKey The name of the method on `target` for which the decorated parameters should be retrieved.
 *
 * @return An object containing a map with all decorated parameters and the transformer for the property.
 */
export function getTransforms<T extends Object>(target: T, propertyKey: keyof T): TransformOptions {
    const transformOptions = Reflect.getMetadata("transformers", target, propertyKey as string | symbol);
    if (transformOptions) {
        return transformOptions;
    }
    const newTransformOptions: TransformOptions = {
        parameterTransforms: new Map(),
    };
    Reflect.defineMetadata("transformers", newTransformOptions, target, propertyKey as string | symbol);
    return newTransformOptions;
}

/**
 * Add a transformer to a property or paramter by decorating it.
 * This will transform the value when it is populated.
 *
 * @param transformer The function to transform the input value with.
 *
 * @return A decorator which can be used to decorate properties and parameters.
 */
export function transform<T, U>(transformer: Transformer<T, U>) {
    return <V extends Object>(target: V, property: keyof V, arg3?: any) => {
        const transforms = getTransforms(target, property);
        if (typeof arg3 === "number") {
            // Called as a parameter decorator.
            transforms.parameterTransforms.set(arg3, transformer);
            return;
        }
        // Called as a property decorator.
        transforms.propertyTransform = transformer;
    };
}
