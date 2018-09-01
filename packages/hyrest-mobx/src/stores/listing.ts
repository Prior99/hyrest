import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface ListingController<KeyType, TModel extends Indexable<KeyType>> {
    list(): Promise<TModel[]>;
}

export abstract class ListingStore<
    KeyType,
    TModel extends Indexable<KeyType>,
    TController extends ListingController<KeyType, TModel>,
> extends BaseStore<KeyType, TModel, TController> {
    @action public async list(): Promise<TModel[]> {
        const models = await this.controller.list();
        models.forEach(model => this.entities.set(model.id, model));
        return models;
    }
}

export function isListingController<KeyType, TModel extends Indexable<KeyType>>(
    controller: any,
): controller is Constructable<ListingController<KeyType, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.list === "function";
}
