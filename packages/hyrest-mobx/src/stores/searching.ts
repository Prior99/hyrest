import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface SearchingController<TKey, TModel extends Indexable<TKey>, TQuery extends any[]> {
    search(...args: TQuery): Promise<TModel[]>;
}

export abstract class SearchingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends SearchingController<TKey, TModel, TQuery>,
    TQuery extends any[],
> extends BaseStore<TKey, TModel, TController> {
    @action public async search(...args: TQuery): Promise<TModel[]> {
        const models = await this.controller.search(...args);
        models.forEach(model => this.entities.set(model.id, model));
        return models;
    }
}

export function isSearchingController<TKey, TModel extends Indexable<TKey>, TQuery extends any[]>(
    controller: any,
): controller is Constructable<SearchingController<TKey, TModel, TQuery>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.search === "function";
}
