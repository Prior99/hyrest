import "reflect-metadata";
import { Schema, getValidatedProperties, getPropertyValidation, is } from "./validation";
import { Scope } from "./scope";
import { Constructable } from "./types";

export function schemaFrom(from: Function): Schema {
    const properties = getValidatedProperties(from.prototype);
    const schema = properties.reduce((result, { property, propertyType }) => {
        const options = getPropertyValidation(from.prototype, property);
        result[property] = is(options.converter)
            .validate(...options.validators)
            .validateCtx(options.validatorFactory)
            .schema(options.validationSchema);
        return result;
    }, {} as Schema);
    Reflect.defineMetadata("validation:schema:origin", from.prototype, schema);
    return schema;
}
