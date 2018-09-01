---
id: api-stores
title: Stores
---

When using [MobX](https://mobx.js.org/) for state management and implementing your API resource oriented,
you can use the [Store](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/globals.html#store) utility to generate an abstract base class for your store using the controller.

To do so, it is important that you name your controller's methods correctly.
When a matching method is detected on the controller, a corresponding method will be generated on the store.
This all happens typesafely.

- Creating: `create(model: Partial<TModel>): Promise<TModel>;` will add a `create` action.
- Reading: `get(id: TKey): Promise<TModel>;` will add a `get` and a `getLazy` action.
- Updating: `update(id: TKey, model: Partial<TModel>): Promise<TModel>;` will add an `update` action.
- Deleting: `delete(id: TKey): Promise<void>;` will add a `delete` action.
- Listing: `list(): Promise<TModel[]>;` will add a `list` action.
- Searching: `search(...args: TQuery): Promise<TModel[]>;` will add a `search` action.

Let's say you implemented a controller with a matching `search`, `get` and `create` method:

```typescript
class Model {
    id?: string;
    name?: string;
}

class DemoController {
    public async create(model: Model) {
        ...
    }

    public async search(name: string, id?: string) {
        ...
    }

    public async get(id: string) {
        ...
    }
}
```

It is then possible to generate similar [actions](https://mobx.js.org/refguide/action.html) on the store's base class.
These methods will keep the internal `entities` map in sync and perform the corresponding operations on the controller:

```typescript
class DemoStore extends Store(DemoController) {
    protected controller = new DemoController();
}
```

The `DemoStore` class will now extend the following classes:

- [CreatingStore](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/classes/creatingstore.html)
- [ReadingStore](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/classes/readingstore.html)
- [SearchingStore](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/classes/searchingstore.html)
- [BaseStore](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/classes/basestore.html)

> Take a look at the related [section in the tutorial](tutorial-todo-store.md).
