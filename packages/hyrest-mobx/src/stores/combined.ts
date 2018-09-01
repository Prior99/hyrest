import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";
import { CreatingStore, CreatingController, isCreatingController } from "./creating";
import { DeletingStore, DeletingController, isDeletingController } from "./deleting";
import { ReadingStore, ReadingController, isReadingController } from "./reading";
import { UpdatingStore, UpdatingController, isUpdatingController } from "./updating";
import { ListingStore, ListingController, isListingController } from "./listing";
import { SearchingStore, SearchingController, isSearchingController } from "./searching";

export type CombinedStore<KeyType, TModel extends Indexable<KeyType>, TController, Query extends any[]> =
    (TController extends CreatingController<KeyType, TModel> ? CreatingStore<KeyType, TModel, TController> : {}) &
    (TController extends DeletingController<KeyType, TModel> ? DeletingStore<KeyType, TModel, TController> : {}) &
    (TController extends ReadingController<KeyType, TModel> ? ReadingStore<KeyType, TModel, TController> : {}) &
    (TController extends UpdatingController<KeyType, TModel> ? UpdatingStore<KeyType, TModel, TController> : {}) &
    (TController extends ListingController<KeyType, TModel> ? ListingStore<KeyType, TModel, TController> : {}) &
    (
        TController extends SearchingController<KeyType, TModel, Query> ?
            SearchingStore<KeyType, TModel, TController, Query> : {}
    );

export function Store<KeyType, TModel extends Indexable<KeyType>, TController, Query extends any[]>(
    controllerClass: Constructable<TController>,
): Constructable<CombinedStore<KeyType, TModel, TController, Query>> {
    abstract class TempStore extends BaseStore<KeyType, TModel, TController> {}
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
