import "reflect-metadata";

export interface BodyParameter {
    readonly index: number;
}

export function getBodyParameters(target: Object, propertyKey: string | symbol): BodyParameter[] {
    const bodyParameters = Reflect.getMetadata("api:route:bodyparameters", target, propertyKey);
    if (bodyParameters) {
        return bodyParameters;
    }
    const newBodyParameters: BodyParameter[] = [];
    Reflect.defineMetadata("api:route:bodyparameters", newBodyParameters, target, propertyKey);
    return newBodyParameters;
}

export function body(): ParameterDecorator {
    return (target: Object, propertyKey: string, index: number) => {
        const bodyParameters = getBodyParameters(target, propertyKey);
        bodyParameters.push({
            index,
        });
    };
}

export interface QueryParameter {
    readonly index: number;
    readonly name: string;
}

export function getQueryParameters(target: Object, propertyKey: string | symbol): QueryParameter[] {
    const queryParameters = Reflect.getMetadata("api:route:queryparameters", target, propertyKey);
    if (queryParameters) {
        return queryParameters;
    }
    const newQueryParameters: QueryParameter[] = [];
    Reflect.defineMetadata("api:route:queryparameters", newQueryParameters, target, propertyKey);
    return newQueryParameters;
}

export function query(name: string): ParameterDecorator {
    return (target: Object, propertyKey: string | symbol, index: number) => {
        const queryParameters = getQueryParameters(target, propertyKey);
        queryParameters.push({
            index,
            name,
        });
    };
}

export interface UrlParameter {
    readonly index: number;
    readonly name: string;
}

export function getUrlParameters(target: Object, propertyKey: string | symbol): UrlParameter[] {
    const urlParameters = Reflect.getMetadata("api:route:urlparameters", target, propertyKey);
    if (urlParameters) {
        return urlParameters;
    }
    const newUrlParameters: UrlParameter[] = [];
    Reflect.defineMetadata("api:route:urlparameters", newUrlParameters, target, propertyKey);
    return newUrlParameters;
}

export function param(name: string): ParameterDecorator {
    return (target: Object, propertyKey: string, index: number) => {
        const urlParameters = getUrlParameters(target, propertyKey);
        urlParameters.push({
            index,
            name,
        });
    };
}
