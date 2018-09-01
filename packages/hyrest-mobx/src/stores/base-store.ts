import { Indexable } from "../types";
import { observable, computed } from "mobx";
import { bind } from "bind-decorator";

export abstract class BaseStore<KeyType, TModel extends Indexable<KeyType>, TController> {
    protected abstract controller: TController;
    @observable protected entities: Map<KeyType, TModel> = new Map();

    @computed public get all() {
        return Array.from(this.entities.values());
    }

    @bind public sorted(comparator: (a: TModel, b: TModel) => number) {
        return Array.from(this.entities.values());
    }

    @bind public byId(id: KeyType): TModel | undefined {
        if (!this.entities.has(id)) { return; }
        return this.entities.get(id);
    }
}
