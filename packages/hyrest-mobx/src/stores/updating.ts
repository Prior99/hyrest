import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface UpdatingController<TKey, TModel extends Indexable<TKey>> {
    update(id: TKey, model: Partial<TModel>): Promise<TModel>;
}

export abstract class UpdatingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends UpdatingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    @action public async update(id: TKey, model: Partial<TModel>): Promise<TModel> {
        const updated = await this.controller.update(id, model);
        this.entities.set(id, updated);
        return updated;
    }
}

export function isUpdatingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<UpdatingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.update === "function";
}
