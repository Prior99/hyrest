import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface CreatingController<TKey, TModel extends Indexable<TKey>> {
    create(model: Partial<TModel>): Promise<TModel>;
}

export abstract class CreatingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends CreatingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    @action public async create(model: Partial<TModel>): Promise<TModel> {
        const newModel = await this.controller.create(model as TModel);
        this.entities.set(newModel.id, newModel);
        return newModel;
    }
}

export function isCreatingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<CreatingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.create === "function";
}
