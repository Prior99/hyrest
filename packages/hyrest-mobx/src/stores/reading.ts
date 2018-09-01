import { action } from "mobx";
import { Constructable } from "hyrest";
import { Indexable } from "../types";
import { BaseStore } from "./base-store";

export interface ReadingController<TKey, TModel extends Indexable<TKey>> {
    get(id: TKey): Promise<TModel>;
}

export abstract class ReadingStore<
    TKey,
    TModel extends Indexable<TKey>,
    TController extends ReadingController<TKey, TModel>,
> extends BaseStore<TKey, TModel, TController> {
    @action public async get(id: TKey): Promise<TModel> {
        const model = await this.controller.get(id);
        if (typeof model === "undefined" || model === null) { return model; }
        this.entities.set(model.id, model);
        return model;
    }

    @action public getLazy(id: TKey): TModel | undefined {
        if (this.entities.has(id)) { return this.entities.get(id); }
        this.get(id);
    }
}

export function isReadingController<TKey, TModel extends Indexable<TKey>>(
    controller: any,
): controller is Constructable<ReadingController<TKey, TModel>> {
    if (typeof controller !== "function") { return false; }
    return typeof controller.prototype.get === "function";
}
