import { Store, CreatingController, CreatingStore, CombinedStore } from "hyrest-mobx";

class ModelA {
    public id?: number;
    public name: string;
}

describe("create and list", () => {
    class TestController {
        private idCounter = 0;

        public async create(model: ModelA): Promise<ModelA> {
            const newModel = new ModelA();
            Object.assign(newModel, {
                id: this.idCounter,
                ...model,
            });
            this.idCounter++;
            return newModel;
        }

        public async list(): Promise<ModelA[]> {
            return [
                await this.create({ name: "list 1" }),
                await this.create({ name: "list 2" }),
            ];
        }
    }

    class TestStore extends Store(TestController) {
        public controller = new TestController();
    }

    test("inferred store", () => {
        const store: any = new TestStore();
        expect(store.create).toBeDefined();
        expect(store.delete).not.toBeDefined();
        expect(store.list).toBeDefined();
        expect(store.get).not.toBeDefined();
        expect(store.search).not.toBeDefined();
        expect(store.update).not.toBeDefined();
    });

    test("create and list", async () => {
        const store = new TestStore();
        expect(store.all).toEqual([]);
        expect(store.byId("some id")).toBeUndefined();
        const model = await store.create({ name: "test name" });
        expect(model).toEqual({
            id: 0,
            name: "test name",
        });
        expect(store.all).toEqual([ model ]);
        expect(store.byId(model.id)).toBe(model);
        const list = await store.list();
        expect(list.length).toBe(2);
        expect(store.all).toEqual([
            { id: 0, name: "test name" },
            { id: 1, name: "list 1" },
            { id: 2, name: "list 2" },
        ]);
    });

    test("sorted", async () => {
        const store = new TestStore();
        await store.create({ name: "a" });
        await store.create({ name: "c" });
        await store.create({ name: "d" });
        await store.create({ name: "b" });
        expect(store.sorted((a, b) => a.name > b.name ? 1 : a.name === b.name ? 0 : -1)).toEqual([
            { id: 0, name: "a" },
            { id: 3, name: "b" },
            { id: 1, name: "c" },
            { id: 2, name: "d" },
        ]);
    });
});

describe("search", () => {
    class TestController {
        private models: ModelA[] = [
            { id: 0, name: "anything" },
            { id: 1, name: "something" },
            { id: 2, name: "everything" },
        ];

        public async search(name: string, id?: number): Promise<ModelA[]> {
            return this.models.filter(model => model.name.includes(name) && (id === undefined || model.id === id));
        }
    }

    class TestStore extends Store(TestController) {
        public controller = new TestController();
    }

    test("inferred store", () => {
        const store: any = new TestStore();
        expect(store.create).not.toBeDefined();
        expect(store.delete).not.toBeDefined();
        expect(store.list).not.toBeDefined();
        expect(store.get).not.toBeDefined();
        expect(store.search).toBeDefined();
        expect(store.update).not.toBeDefined();
    });

    test("search", async () => {
        const store = new TestStore();
        expect(store.all).toEqual([]);
        expect(await store.search("any")).toEqual([ { id: 0, name: "anything" } ]);
        expect(store.all).toEqual([ { id: 0, name: "anything" } ]);
        expect(store.byId(0)).toEqual({ id: 0, name: "anything" });
    });
});

describe("delete and get", () => {
    class TestController {
        private models: ModelA[] = [
            { id: 0, name: "anything" },
            { id: 1, name: "something" },
            { id: 2, name: "everything" },
        ];

        public async delete(id?: number): Promise<void> {
            this.models = this.models.filter(model => model.id !== id);
        }

        public async get(id: number): Promise<ModelA> {
            return this.models.find(model => model.id === id);
        }
    }

    class TestStore extends Store(TestController) {
        public controller = new TestController();
    }

    test("inferred store", () => {
        const store: any = new TestStore();
        expect(store.create).not.toBeDefined();
        expect(store.delete).toBeDefined();
        expect(store.list).not.toBeDefined();
        expect(store.get).toBeDefined();
        expect(store.search).not.toBeDefined();
        expect(store.update).not.toBeDefined();
    });

    test("delete and get", async () => {
        const store = new TestStore();
        expect(store.all).toEqual([]);
        expect(await store.get(1)).toEqual({ id: 1, name: "something" });
        expect(store.all).toEqual([ { id: 1, name: "something" } ]);
        await store.delete(1);
        expect(store.all).toEqual([]);
        expect(await store.get(1)).toEqual(undefined);
        expect(store.all).toEqual([]);
    });
});

describe("updating", () => {
    class TestController {
        private models: ModelA[] = [
            { id: 0, name: "anything" },
            { id: 1, name: "something" },
            { id: 2, name: "everything" },
        ];

        public async update(id: number, model: Partial<ModelA>): Promise<ModelA> {
            const found = await this.get(id);
            Object.assign(found, model);
            return found;
        }

        public async get(id: number): Promise<ModelA> {
            return this.models.find(model => model.id === id);
        }
    }

    class TestStore extends Store(TestController) {
        public controller = new TestController();
    }

    test("inferred store", () => {
        const store: any = new TestStore();
        expect(store.create).not.toBeDefined();
        expect(store.delete).not.toBeDefined();
        expect(store.list).not.toBeDefined();
        expect(store.get).toBeDefined();
        expect(store.search).not.toBeDefined();
        expect(store.update).toBeDefined();
    });

    test("update and get", async () => {
        const store = new TestStore();
        expect(store.all).toEqual([]);
        const updated = await store.update(1, { name: "other" });
        expect(store.all).toEqual([ updated ]);
        expect(updated).toEqual(await store.get(1));
    });
});

describe("get", () => {
    class TestController {
        public async get(id: number): Promise<ModelA> {
            const model = new ModelA();
            Object.assign(model, { id, name: "one" });
            return model;
        }
    }

    class TestStore extends Store(TestController) {
        public controller = new TestController();
    }

    test("inferred store", () => {
        const store: any = new TestStore();
        expect(store.create).not.toBeDefined();
        expect(store.delete).not.toBeDefined();
        expect(store.list).not.toBeDefined();
        expect(store.get).toBeDefined();
        expect(store.search).not.toBeDefined();
        expect(store.update).not.toBeDefined();
    });

    test("getLazy", async () => {
        const store = new TestStore();
        expect(store.getLazy(3)).toBeUndefined();
        await new Promise(resolve => setTimeout(resolve));
        expect(store.byId(3)).toEqual({ id: 3, name: "one" });
        expect(store.getLazy(3)).toEqual({ id: 3, name: "one" });
    });
});

test("handing wrong values to Store()", () => {
    class TestStore extends (Store("string" as any) as any) {
    }

    const store: any = new TestStore();
    expect(store.create).not.toBeDefined();
    expect(store.delete).not.toBeDefined();
    expect(store.list).not.toBeDefined();
    expect(store.get).not.toBeDefined();
    expect(store.search).not.toBeDefined();
    expect(store.update).not.toBeDefined();
});
