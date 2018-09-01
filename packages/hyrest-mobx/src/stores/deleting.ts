import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface DeletingController<TKey, TModel extends Indexable<TKey>> {
    delete(id: TKey): Promise<void>;
}

export abstract class DeletingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends DeletingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    @action public async delete(id: TKey): Promise<void> {
        await this.controller.delete(id);
        this.entities.delete(id);
    }
}

export function isDeletingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<DeletingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.delete === "function";
}
