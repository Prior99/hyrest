import "reflect-metadata";
import { Schema } from "./validation";
import { Constructable } from "./types";

export function validatable<T extends Constructable>(from: T): T {
    console.log(Reflect.getMetadataKeys(from));
    return from;
}

export function schemaFrom(from: Function): Schema {
    console.log(Reflect.getMetadataKeys(from.prototype, "email"));
    console.log(Object.getOwnPropertyNames(from));
    return;
}
