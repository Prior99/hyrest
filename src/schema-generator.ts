import "reflect-metadata";
import { Schema, getValidatedProperties, getPropertyValidation, is } from "./validation";
import { Scope } from "./scope";
import { Constructable } from "./types";

export function schemaFrom(from: Function, scope?: Scope): Schema {
    const properties = getValidatedProperties(from.prototype);
    return properties.reduce((result, { property, propertyType }) => {
        if (scope && !scope.propertiesForClass(from).find(meta => meta.property === property)) {
            return result;
        }
        const options = getPropertyValidation(from.prototype, property);
        (result as any)[property] = is(options.converter)
            .validate(...options.validators)
            .validateCtx(options.validatorFactory)
            .schema(options.validationSchema);
        return result;
    }, {});
}
