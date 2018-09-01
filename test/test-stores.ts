import { Store, CreatingController, CreatingStore, CombinedStore, Indexable } from "hyrest-mobx";

class ModelA implements Indexable<string> {
    public id?: string;
    public name?: string;
}

class ControllerA implements CreatingController<string, ModelA> {
    public async create(model: ModelA): Promise<ModelA> {
        const newModel = new ModelA();
        newModel.id = "some id";
        return newModel;
    }

    public async list(): Promise<ModelA[]> {
        return [ new ModelA(), new ModelA() ];
    }
}

class StoreA extends Store(ControllerA) {
    public controller = new ControllerA();
}

Store(ControllerA);

test("inferred store", () => {
    const store: any = new StoreA();
    expect(store.create).toBeDefined();
    expect(store.delete).not.toBeDefined();
    expect(store.list).toBeDefined();
    expect(store.read).not.toBeDefined();
    expect(store.search).not.toBeDefined();
    expect(store.update).not.toBeDefined();
});

test("simple create and list store", async () => {
    const store = new StoreA();
    expect(store.all).toEqual([]);
    expect(store.byId("some id")).toBeUndefined();
    const model = await store.create({ name: "test name" });
    expect(model).toEqual({
        id: "some id",
        name: "test name",
    });
    expect(store.all).toEqual([ model ]);
    expect(store.byId(model.id)).toBe(model);
    const list = await store.list();
    expect(list.length).toBe(2);
    expect(store.all).toEqual([ model, ...list ]);
});
