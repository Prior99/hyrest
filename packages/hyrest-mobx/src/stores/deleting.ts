import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

/**
 * A controller that can delete entities.
 */
export interface DeletingController<TKey, TModel extends Indexable<TKey>> {
    /**
     * Delete an entity with the specified id.
     *
     * @param id The id of the entity to delete.
     */
    delete(id: TKey): Promise<void>;
}

/**
 * A store for a controller that can delete entities.
 */
export abstract class DeletingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends DeletingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    /**
     * Delete an entity. This will trigger `delete` on the controller and afterwards remove the
     * entity with the given id from the cache.
     *
     * @param id The id of the entity to delete.
     */
    @action public async delete(id: TKey): Promise<void> {
        await this.controller.delete(id);
        this.entities.delete(id);
    }
}

/**
 * Checks whether a given controller has a `delete` method and is hence a `DeletingController`.
 *
 * @param controller The class to check.
 *
 * @return Will return `true` if the controller can delete and `false` otherwise.
 */
export function isDeletingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<DeletingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.delete === "function";
}
