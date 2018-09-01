import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface UpdatingController<KeyType, TModel extends Indexable<KeyType>> {
    update(id: KeyType, model: TModel): Promise<TModel>;
}

export abstract class UpdatingStore<
    KeyType,
    TModel extends Indexable<KeyType>,
    TController extends UpdatingController<KeyType, TModel>,
> extends BaseStore<KeyType, TModel, TController> {
    @action public async update(id: KeyType, model: TModel): Promise<TModel> {
        const updated = await this.controller.update(id, model);
        this.entities.set(id, updated);
        return updated;
    }
}

export function isUpdatingController<KeyType, TModel extends Indexable<KeyType>>(
    controller: any,
): controller is Constructable<UpdatingController<KeyType, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.update === "function";
}
