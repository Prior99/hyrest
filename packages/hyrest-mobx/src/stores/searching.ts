import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface SearchingController<KeyType, TModel extends Indexable<KeyType>, Query extends any[]> {
    search(...args: Query): Promise<TModel[]>;
}

export abstract class SearchingStore<
    KeyType,
    TModel extends Indexable<KeyType>,
    TController extends SearchingController<KeyType, TModel, Query>,
    Query extends any[],
> extends BaseStore<KeyType, TModel, TController> {
    @action public async search(...args: Query): Promise<TModel[]> {
        const models = await this.controller.search(...args);
        models.forEach(model => this.entities.set(model.id, model));
        return models;
    }
}

export function isSearchingController<KeyType, TModel extends Indexable<KeyType>, Query extends any[]>(
    controller: any,
): controller is Constructable<SearchingController<KeyType, TModel, Query>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.search === "function";
}
