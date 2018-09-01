import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

/**
 * A controller that can search for entities.
 */
export interface SearchingController<TKey, TModel extends Indexable<TKey>, TQuery extends any[]> {
    /**
     * Search for entities by a given query. The query can be a set of arguments.
     *
     * @return A list of all entities matching the specified query.
     */
    search(...args: TQuery): Promise<TModel[]>;
}

/**
 * A store for a controller that can search for entities.
 */
export abstract class SearchingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends SearchingController<TKey, TModel, TQuery>,
    TQuery extends any[],
> extends BaseStore<TKey, TModel, TController> {
    /**
     * Search for entities. This will trigger `search` on the controller with the specified arguments.
     * It will store all entities into the cache.
     *
     * @return The entities as returned by the controller.
     */
    @action public async search(...args: TQuery): Promise<TModel[]> {
        const models = await this.controller.search(...args);
        models.forEach(model => this.entities.set(model.id, model));
        return models;
    }
}

/**
 * Checks whether a given controller has a `search` method and is hence a `SearchingController`.
 *
 * @param controller The class to check.
 *
 * @return Will return `true` if the controller can search and `false` otherwise.
 */
export function isSearchingController<TKey, TModel extends Indexable<TKey>, TQuery extends any[]>(
    controller: any,
): controller is Constructable<SearchingController<TKey, TModel, TQuery>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.search === "function";
}
