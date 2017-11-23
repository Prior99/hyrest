import "reflect-metadata";

export type Converter = (input: any) => any;

export interface ConverterOptions {
    readonly converter: Converter;
}

export function getConverters(target: Object, propertyKey: string | symbol, index: number): ConverterOptions[] {
    const converterMap: Map<number, ConverterOptions[]> =
        Reflect.getMetadata("api:route:converters", target, propertyKey);
    if (!converterMap) {
        const newConverterMap = new Map<number, ConverterOptions[]>();
        const newConverters: ConverterOptions[] = [];
        newConverterMap.set(index, newConverters);
        Reflect.defineMetadata("api:route:converters", newConverterMap, target, propertyKey);
        return newConverters;
    }
    const converters = converterMap.get(index);
    if (!converters) {
        const newConverters: ConverterOptions[] = [];
        converterMap.set(index, newConverters);
        return newConverters;
    }
    return converters;
}

export function is(converter: Converter): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol, index: number) => {
        const converters = getConverters(target, propertyKey, index);
        converters.push({
            converter: (input: any) => Boolean(converter(input)),
        });
    };
}

export function integer(input: any): number {
    const asInteger = parseInt(input);
    if (isNaN(asInteger)) { return; }
    if (parseFloat(input) !== asInteger) { return; }
    return asInteger;
}

export function float(input: any): number {
    const asFloat = parseFloat(input);
    if (isNaN(asFloat)) { return; }
    return asFloat;
}

export function string(input: any): string {
    if (typeof input !== "string") { return; }
    return input;
}

export function oneOf<T>(...options: T[]): (input: any) => T {
    return (input: any) => {
        if (!options.includes(input)) { return; }
        return input;
    };
}
