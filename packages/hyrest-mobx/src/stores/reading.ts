import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface ReadingController<KeyType, TModel extends Indexable<KeyType>> {
    read(id: KeyType): Promise<TModel>;
}

export abstract class ReadingStore<
    KeyType,
    TModel extends Indexable<KeyType>,
    TController extends ReadingController<KeyType, TModel>,
> extends BaseStore<KeyType, TModel, TController> {
    @action public async read(id: KeyType): Promise<TModel> {
        const model = await this.controller.read(id);
        this.entities.set(model.id, model);
        return model;
    }
}

export function isReadingController<KeyType, TModel extends Indexable<KeyType>>(
    controller: any,
): controller is Constructable<ReadingController<KeyType, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.read === "function";
}
