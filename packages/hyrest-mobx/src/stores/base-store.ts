import { Indexable } from "../types";
import { observable, computed } from "mobx";
import { bind } from "bind-decorator";

export abstract class BaseStore<TKey, TModel extends Indexable<TKey>, TController> {
    protected abstract controller: TController;
    @observable protected entities: Map<TKey, TModel> = new Map();

    @computed public get all() {
        return Array.from(this.entities.values());
    }

    @bind public sorted(comparator: (a: TModel, b: TModel) => number) {
        return Array.from(this.entities.values()).sort(comparator);
    }

    @bind public byId(id: TKey): TModel | undefined {
        if (!this.entities.has(id)) { return; }
        return this.entities.get(id);
    }
}
