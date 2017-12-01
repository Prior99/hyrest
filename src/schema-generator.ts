import "reflect-metadata";
import { Schema, getValidatedProperties, getPropertyValidation, is } from "./validation";
import { Scope } from "./scope";
import { Constructable } from "./types";

/**
 * Generate a schema from a decorated class.
 *
 * @param from The class to generate the schema from.
 *
 * @return The generated schema.
 */
export function schemaFrom(from: Function): Schema {
    // Get all validated properties from the class. These are all properties decorated with `@is`.
    const properties = getValidatedProperties(from.prototype);
    const schema = properties.reduce((result, { property, propertyType }) => {
        // Get all validation options for this specific property.
        const options = getPropertyValidation(from.prototype, property);
        // Create a new full validatior and store it on the object which will be returned as the newly
        // created schema.
        result[property] = is(options.converter)
            .validate(...options.validators)
            .validateCtx(options.validatorFactory)
            .schema(options.validationSchema);
        return result;
    }, {} as Schema);
    // Set the original class as metadata on the object for later use with scoped validation.
    Reflect.defineMetadata("validation:schema:origin", from.prototype, schema);
    return schema;
}
