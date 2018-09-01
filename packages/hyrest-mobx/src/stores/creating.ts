import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface CreatingController<KeyType, TModel extends Indexable<KeyType>> {
    create(model: TModel): Promise<TModel>;
}

export abstract class CreatingStore<
    KeyType,
    TModel extends Indexable<KeyType>,
    TController extends CreatingController<KeyType, TModel>,
> extends BaseStore<KeyType, TModel, TController> {
    @action public async create(model: TModel): Promise<TModel> {
        const newModel = await this.controller.create(model);
        this.entities.set(newModel.id, newModel);
        return newModel;
    }
}

export function isCreatingController<KeyType, TModel extends Indexable<KeyType>>(
    controller: any,
): controller is Constructable<CreatingController<KeyType, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.create === "function";
}
