import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface DeletingController<KeyType, TModel extends Indexable<KeyType>> {
    delete(id: KeyType): Promise<void>;
}

export abstract class DeletingStore<
    KeyType,
    TModel extends Indexable<KeyType>,
    TController extends DeletingController<KeyType, TModel>,
> extends BaseStore<KeyType, TModel, TController> {
    @action public async delete(id: KeyType): Promise<void> {
        await this.controller.delete(id);
    }
}

export function isDeletingController<KeyType, TModel extends Indexable<KeyType>>(
    controller: any,
): controller is Constructable<DeletingController<KeyType, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.delete === "function";
}
