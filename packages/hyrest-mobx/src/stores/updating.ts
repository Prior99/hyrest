import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

/**
 * A controller that can update entities.
 */
export interface UpdatingController<TKey, TModel extends Indexable<TKey>> {
    /**
     * Update an entity with the given id.
     *
     * @param id The id of the entity to update.
     * @param model A partial sub-set of the entity to update.
     *
     * @return The updated entity.
     */
    update(id: TKey, model: Partial<TModel>): Promise<TModel>;
}

/**
 * A store for a controller that can update entities.
 */
export abstract class UpdatingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends UpdatingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    /**
     * Update a specified entitiy. This will trigger `update` on the controller and store store the updated entity
     * into the cache.
     *
     * @param id The id of the entity to update.
     * @param model A partial sub-set of the entity to update.
     *
     * @return The updated entity as returned by the controller.
     */
    @action public async update(id: TKey, model: Partial<TModel>): Promise<TModel> {
        const updated = await this.controller.update(id, model);
        this.entities.set(id, updated);
        return updated;
    }
}

/**
 * Checks whether a given controller has an `update` method and is hence a `UpdatingController`.
 *
 * @param controller The class to check.
 *
 * @return Will return `true` if the controller can update entities and `false` otherwise.
 */
export function isUpdatingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<UpdatingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.update === "function";
}
