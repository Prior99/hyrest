import "reflect-metadata";

export interface Converted<T> {
    error?: string;
    value?: T;
}

export type Converter<T> = (input: any) => Converted<T> | Promise<Converted<T>>;

export interface ConverterOptions<T> {
    readonly converter: Converter<T>;
}

export interface Schema {

}

function validateSchema<T extends Object>(validationSchema: Schema, value: T): T {
    return value;
}

/**
 * Retrieves all the converters for a given parameter at index `index` on the method with name `propertyKey` on the
 * instance of a controller `target`.
 * This function is always guaranteed to return an array. If no converters were defined yet, a new metadata key with
 * an empty array is created.
 *
 * @param target The target instance of a @controller decorated object on which a method's parameter should be
 *               looked up.
 * @param propertyKey The name of a method on `target` on which a parameter should be decorated.
 * @param index The index of the parameter to decorate.
 *
 * @return An array of existing converters to which new converters can be appended. Is always guaranteed to return
 *         an array.
 */
export function getConverters(target: Object, propertyKey: string | symbol, index: number): ConverterOptions<any>[] {
    // Try to retrieve the `Map` of all converters with the keys being the parameter index and the value being
    // an array containing all converters.
    const map: Map<number, ConverterOptions<any>[]> = Reflect.getMetadata("api:route:converters", target, propertyKey);

    // If no map has been found then this function has never been called for this method before. A new map needs
    // to be created and an empty array needs to be attached.
    if (!map) {
        const newMap = new Map<number, ConverterOptions<any>[]>();
        const newConverters: ConverterOptions<any>[] = [];
        newMap.set(index, newConverters);

        // Define the new key on the reflection metadatas.
        Reflect.defineMetadata("api:route:converters", newMap, target, propertyKey);
        return newConverters;
    }

    // If the code reaches here, a map existed and at least one converter has already been attached to the map.
    // Read the array of converters from the map for the given parameter index.
    const converters = map.get(index);

    // If no array is present, a new one needs to be created and inserted into the map.
    if (!converters) {
        const newConverters: ConverterOptions<any>[] = [];
        map.set(index, newConverters);
        return newConverters;
    }
    return converters;
}

/**
 * This decorator can be applied to a parameter in a `@route` and will make sure that the input
 * can be converted to the given data type and will then convert it.
 *
 * @param converter A converter to convert the raw input.
 *
 * @return A decorator for a parameter in a @route method.
 */
export function is(converter: Converter<any>): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol, index: number) => {
        const converters = getConverters(target, propertyKey, index);
        converters.push({
            converter: (input: any) => converter(input),
        });
    };
}

/**
 * Converts the given input to an integer if possible.
 *
 * @param input The input to convert to an integer. Can be anything in any form.
 *
 * @return An integer if the conversion succeeded or an error if the input was not a valid
 *         integer.
 */
export function integer(input: any): Converted<number> {
    if (typeof input === "undefined") { return { value: input }; }
    const value = parseInt(input);
    if (isNaN(value) || parseFloat(input) !== value) { return { error: "Not a valid integer." }; }
    return { value };
}

/**
 * Converts the given input to a float if possible.
 *
 * @param input The input to convert to a float. Can be anything in any form.
 *
 * @return A float if the conversion succeeded or an error if the input was not a valid
 *         float.
 */
export function float(input: any): Converted<number> {
    if (typeof input === "undefined") { return { value: input }; }
    const value = parseFloat(input);
    if (isNaN(value)) { return { error: "Not a valid float." }; }
    return { value} ;
}

/**
 * Makes sure the given input is a string.
 *
 * @param input The input to check.
 *
 * @return The string in `input` if it was a string and an error otherwise.
 */
export function string(value: any): Converted<string> {
    if (typeof value === "undefined") { return { value }; }
    if (typeof value !== "string") { return { error: "Not a valid string." }; }
    return { value };
}

/**
 * Enforces `input` to be one of the values specified in `options`.
 *
 * @param options The options of which `input` needs to be.
 *
 * @return A Converter which checks if the input is one of `options` and returns an error if that was
 *         not the case and the `input` itself otherwise.
 */
export function oneOf<T>(...options: T[]): (value: any) => Converted<T> {
    return (value: any) => {
        if (typeof value === "undefined") { return { value }; }
        if (!options.includes(value)) { return { error: `Not one of (${options.join(", ")}).` }; }
        return { value };
    };
}

/**
 * Makes sure the given input is not `null` or `undefined`.
 *
 * @param input The input to check.
 *
 * @return The input if it was not `undefined` or `null`, otherwise an error will be returned.
 */
export function required<T>(value: T): Converted<T> {
    if (typeof value === "undefined" || value === null) { return { error: "Is required." }; }
    return { value };
}

/**
 * Makes sure the given input object matches the providedschema.
 *
 * @param input The input to check.
 *
 * @return The input if it matched the schema and an error otherwise.
 */
export function schema<T extends Object>(validationSchema: Schema): (value: T) => Converted<T> {
    return (value: T) => {
        if (typeof value === "undefined") { return { value }; }
        else if (!validateSchema(validationSchema, value)) {
            return { error: "Schema validation failed." };
        }
        return { value };
    };
}
