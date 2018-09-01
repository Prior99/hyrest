import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";
import { CreatingStore, CreatingController, isCreatingController } from "./creating";
import { DeletingStore, DeletingController, isDeletingController } from "./deleting";
import { ReadingStore, ReadingController, isReadingController } from "./reading";
import { UpdatingStore, UpdatingController, isUpdatingController } from "./updating";
import { ListingStore, ListingController, isListingController } from "./listing";
import { SearchingStore, SearchingController, isSearchingController } from "./searching";

/**
 * A store with all corresponding interfaces for the specified controllers.
 * This will join all store-classes belonging to their corresponding controller classes into one interface.
 */
export type CombinedStore<TKey, TModel extends Indexable<TKey>, TController, TQuery extends any[]> =
    (TController extends CreatingController<TKey, TModel> ? CreatingStore<TKey, TModel, TController> : {}) &
    (TController extends DeletingController<TKey, TModel> ? DeletingStore<TKey, TModel, TController> : {}) &
    (TController extends ReadingController<TKey, TModel> ? ReadingStore<TKey, TModel, TController> : {}) &
    (TController extends UpdatingController<TKey, TModel> ? UpdatingStore<TKey, TModel, TController> : {}) &
    (TController extends ListingController<TKey, TModel> ? ListingStore<TKey, TModel, TController> : {}) &
    (
        TController extends SearchingController<TKey, TModel, TQuery> ?
            SearchingStore<TKey, TModel, TController, TQuery> : {}
    );

/**
 * Any controller that can be passed to `Store`.
 */
export type AnyController<TKey, TModel extends Indexable<TKey>, TQuery extends any[]> =
    CreatingController<TKey, TModel> |
    DeletingController<TKey, TModel> |
    ReadingController<TKey, TModel> |
    UpdatingController<TKey, TModel> |
    ListingController<TKey, TModel> |
    SearchingController<TKey, TModel, TQuery>;

/**
 * Extracts the type of the id used for indexing the models from a given controller.
 */
type KeyType<TController> = TController extends AnyController<infer TKey, any, any> ? TKey : never;

/**
 * Extracts the type of the model from a given controller.
 */
type ModelType<TController> = TController extends AnyController<any, infer TModel, any> ? TModel : never;

/**
 * Extracts the type of the query for the `search` method from a given controller.
 */
type QueryType<TController> = TController extends AnyController<any, any, infer TQuery> ? TQuery : never;

/**
 * Wil infer a store's class from a given controller.
 * The set of methods available on the store depends on the methods implemented in the controller.
 *
 * If the controller for example implemented a `create` method with the correct signature, a `create` method will
 * also exist on the store.
 *
 * @param controllerClass The class of the controller from which the store's class should be inferred.
 *
 * @return An abstract class for creating new stores corresponding to the provided controller's class.
 */
export function Store<
    TKey,
    TModel extends Indexable<TKey>,
    TQuery extends any[],
    TController extends AnyController<TKey, TModel, TQuery>,
>(
    controllerClass: Constructable<TController>,
): Constructable<CombinedStore<KeyType<TController>, ModelType<TController>, TController, QueryType<TController>>> {
    // Create a mutable class from `BaseStore` onto which the traits of the matching classes can be applied.
    abstract class TempStore extends BaseStore<TKey, TModel, TController> {}
    const mutableTempStore = TempStore as any;
    // Save a list of all matching classes.
    const matchingStoreClasses: any[] = [];
    if (isCreatingController(controllerClass)) { matchingStoreClasses.push(CreatingStore); }
    if (isDeletingController(controllerClass)) { matchingStoreClasses.push(DeletingStore); }
    if (isReadingController(controllerClass)) { matchingStoreClasses.push(ReadingStore); }
    if (isListingController(controllerClass)) { matchingStoreClasses.push(ListingStore); }
    if (isUpdatingController(controllerClass)) { matchingStoreClasses.push(UpdatingStore); }
    if (isSearchingController(controllerClass)) { matchingStoreClasses.push(SearchingStore); }
    // Apply all matching store classes as if they were mixins.
    matchingStoreClasses.forEach(storeClass => {
        Object.getOwnPropertyNames(storeClass.prototype)
            .filter(name => name !== "constructor")
            .forEach(name => {
                mutableTempStore.prototype[name] = storeClass.prototype[name];
            });
    });
    return mutableTempStore;
}
