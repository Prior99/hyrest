import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

/**
 * A controller that can list entities.
 */
export interface ListingController<TKey, TModel extends Indexable<TKey>> {
    /**
     * List all entities know to this controller.
     *
     * @return A list of all known entities.
     */
    list(): Promise<TModel[]>;
}

/**
 * A store for a controller that can list entities.
 */
export abstract class ListingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends ListingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    /**
     * List all entities. This will trigger `list` on the controller and store all entities into the cache.
     *
     * @return All entities as returned by the controller.
     */
    @action public async list(): Promise<TModel[]> {
        const models = await this.controller.list();
        models.forEach(model => this.entities.set(model.id, model));
        return models;
    }
}

/**
 * Checks whether a given controller has a `list` method and is hence a `ListingController`.
 *
 * @param controller The class to check.
 *
 * @return Will return `true` if the controller can list and `false` otherwise.
 */
export function isListingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<ListingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.list === "function";
}
