import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";
import { CreatingStore, CreatingController, isCreatingController } from "./creating";
import { DeletingStore, DeletingController, isDeletingController } from "./deleting";
import { ReadingStore, ReadingController, isReadingController } from "./reading";
import { UpdatingStore, UpdatingController, isUpdatingController } from "./updating";
import { ListingStore, ListingController, isListingController } from "./listing";
import { SearchingStore, SearchingController, isSearchingController } from "./searching";

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

export type AnyController<TKey, TModel extends Indexable<TKey>, TQuery extends any[]> =
    CreatingController<TKey, TModel> |
    DeletingController<TKey, TModel> |
    ReadingController<TKey, TModel> |
    UpdatingController<TKey, TModel> |
    ListingController<TKey, TModel> |
    SearchingController<TKey, TModel, TQuery>;

type KeyType<TController> = TController extends AnyController<infer TKey, any, any> ? TKey : never;
type ModelType<TController> = TController extends AnyController<any, infer TModel, any> ? TModel : never;
type QueryType<TController> = TController extends AnyController<any, any, infer TQuery> ? TQuery : never;

export function Store<
    TKey,
    TModel extends Indexable<TKey>,
    TQuery extends any[],
    TController extends AnyController<TKey, TModel, TQuery>,
>(
    controllerClass: Constructable<TController>,
): Constructable<CombinedStore<KeyType<TController>, ModelType<TController>, TController, QueryType<TController>>> {
    abstract class TempStore extends BaseStore<TKey, TModel, TController> {}
    const mutableTempStore = TempStore as any;
    const matchingStoreClasses: any[] = [];

    if (isCreatingController(controllerClass)) { matchingStoreClasses.push(CreatingStore); }
    if (isDeletingController(controllerClass)) { matchingStoreClasses.push(DeletingStore); }
    if (isReadingController(controllerClass)) { matchingStoreClasses.push(ReadingStore); }
    if (isListingController(controllerClass)) { matchingStoreClasses.push(ListingStore); }
    if (isUpdatingController(controllerClass)) { matchingStoreClasses.push(UpdatingStore); }
    if (isSearchingController(controllerClass)) { matchingStoreClasses.push(SearchingStore); }

    matchingStoreClasses.forEach(storeClass => {
        Object.getOwnPropertyNames(storeClass.prototype)
            .filter(name => name !== "constructor")
            .forEach(name => {
                mutableTempStore.prototype[name] = storeClass.prototype[name];
            });
    });

    return mutableTempStore;
}
