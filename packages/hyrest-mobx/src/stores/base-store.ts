import { Indexable } from "../types";
import { observable, computed } from "mobx";
import { bind } from "bind-decorator";

/**
 * Underlying basic abstract class inherited by all stores.
 * This class provides a map of cached entities and basic operations on them.
 */
export abstract class BaseStore<TKey, TModel extends Indexable<TKey>, TController> {
    /**
     * The controller used to perform network operations.
     * Must be provided by the extending store.
     */
    protected abstract controller: TController;

    /**
     * Observable cache for all entities loaded from the controller.
     * Will be updated by each operation.
     */
    @observable protected entities: Map<TKey, TModel> = new Map();

    /**
     * An array of all entities that are currently cached.
     */
    @computed public get all() {
        return Array.from(this.entities.values());
    }

    /**
     * With a provided comparator, will return a sorted version of `BaseStore.all`.
     * This is a shorthand for writing `BaseStore.all.sort`.
     *
     * @param comparator A comparator function for use with `Array.sort`.
     *
     * @return A sorted array of all cached entities.
     */
    @bind public sorted(comparator: (a: TModel, b: TModel) => number) {
        return Array.from(this.entities.values()).sort(comparator);
    }

    /**
     * Returns a single entity by its id. Will not perform any operations on the controller.
     * If no entity with the given id exists, this will return `undefined`.
     *
     * @param id The id of the entity to return.
     *
     * @return The entity with the specified id or `undefined`, if no such entity existed.
     */
    @bind public byId(id: TKey): TModel | undefined {
        if (!this.entities.has(id)) { return; }
        return this.entities.get(id);
    }
}
