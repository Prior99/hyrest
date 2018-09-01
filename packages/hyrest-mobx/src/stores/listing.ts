import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface ListingController<TKey, TModel extends Indexable<TKey>> {
    list(): Promise<TModel[]>;
}

export abstract class ListingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends ListingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    @action public async list(): Promise<TModel[]> {
        const models = await this.controller.list();
        models.forEach(model => this.entities.set(model.id, model));
        return models;
    }
}

export function isListingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<ListingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.list === "function";
}
