import "reflect-metadata";
import { Schema, getValidatedProperties, getPropertyValidation, is } from "./validation";
import { Constructable } from "./types";

export function schemaFrom(from: Function): Schema {
    const properties = getValidatedProperties(from.prototype);
    return properties.reduce((result, { property, propertyType }) => {
        const options = getPropertyValidation(from.prototype, property);
        (result as any)[property] = is(options.converter)
            .validate(...options.validators)
            .validateCtx(options.validatorFactory);
        return result;
    }, {});
}
