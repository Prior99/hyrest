import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

/**
 * A controller that can get entities by their id.
 */
export interface ReadingController<TKey, TModel extends Indexable<TKey>> {
    /**
     * Get an entity by its id.
     *
     * @param id The id of the entity to get.
     *
     * @return The entity with the specified id.
     */
    get(id: TKey): Promise<TModel>;
}

/**
 * A store for a controller that can get entities by their id.
 */
export abstract class ReadingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends ReadingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    /**
     * Get an entity by its id. This will trigger `get` on the controller and store the returned entity
     * unless `undefined` or `null` was returned. Will always return the return value of the call to the
     * controller's `get` method. Will always b
     *
     * @param id The id of the entity to get.
     *
     * @return The entity with the specified id as returned by the controller.
     */
    @action public async get(id: TKey): Promise<TModel> {
        const model = await this.controller.get(id);
        if (typeof model === "undefined" || model === null) { return model; }
        this.entities.set(model.id, model);
        return model;
    }

    /**
     * Get an entity by its id. This will trigger `get` on the controller and store the returned entity
     * unless `undefined` or `null` was returned. Will always return the return value of the call to the
     * controller's `get` method.
     *
     * @param id The id of the entity to get.
     *
     * @return The entity with the specified id as returned by the controller.
     */
    @action public getLazy(id: TKey): TModel | undefined {
        this.get(id);
        return this.entities.get(id);
    }
}

/**
 * Checks whether a given controller has a `get` method and is hence a `ReadingController`.
 *
 * @param controller The class to check.
 *
 * @return Will return `true` if the controller can get entities by id and `false` otherwise.
 */
export function isReadingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<ReadingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.get === "function";
}
