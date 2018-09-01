---
id: tutorial-todo-store
title: 13. Todo Store
---

The frontend has to maintain a cached version of all known todos it has ever encountered.
For this, create a directory `src/web/store` and place a file called `todos.ts` into it.
This file will provide the state-management related to all `Todo` instances.
It will perform the calls to the controller and expresses the frontend's part of the application logic.

## Manually

You can implement the store much to your liking completely manually.
Hyrest doesn't enforce a certain structure. However, when making sure to [name the methods](tutorial-controller.md#methods) in the corresponding controller correctly,
much of the store can be [inferred implicitly](#automatically).

### Basic store

Add a new [TSDI component](https://tsdi.js.org/docs/en/getting-started.html#decorate-your-components) class to it.
It will be using the `TodoController` underneath to communicate with the backend, therefore inject it:

```typescript
import { component, inject } from "tsdi";
import { TodosController } from "../../common";

@component
export class TodosStore {
    @inject private controller: TodosController;
}
```

### Observable map

We will load all todos at startup and keep them in an [ES6 Map](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Map).
In general, you should aim to keep your state normalized at all times.
Hence the map will have the todo's ids as keys and the corresponding todo instances as values.

> We are not dealing with Redux here, but I very much recommend reading its [guide about normalized state](https://redux.js.org/recipes/structuringreducers/normalizingstateshape).
> It's a very helpful pattern and applies to all state-management, not just to Redux.

As we are using MobX, decorate the map with [@observable](https://mobx.js.org/refguide/observable.html):

```typescript
@observable private todos = new Map<string, Todo>();
```

### Loading the todos

At application startup, the todos should be loaded.
For this, add an asynchronous [initialize lifecycle hook](https://tsdi.js.org/docs/en/features.html#lifecycle-methods) in which the controller's `list()` method is used to load an array of all todos.
Insert each todo instance into the map:

```typescript
@initialize
protected async initialize() {
    const todos = await this.controller.list();
    todos.forEach(todo => this.todos.set(todo.id, todo));
}
```

### Accessing the todos

We could simply make the `todos` map public and expose it, but I suggest keeping our component [encapsulated](https://en.wikipedia.org/wiki/Encapsulation_(computer_programming)).

Add a method for getting one single todo by id:

```typescript
public byId(id: string) { return this.todos.get(id); }
```

Also add a [@computed](https://mobx.js.org/refguide/computed-decorator.html) getter for listing all todos.

```typescript
@computed public get all() { return Array.from(this.todos.values()); }
```

### Creating new todos

When creating new todos, we also want to update our cache. Add a [MobX action](https://mobx.js.org/refguide/action.html):

```typescript
@action.bound public async create(todo: Todo) {
    const newTodo = await this.controller.create(todo);
    this.todos.set(todo.id, todo);
}
```

### Removing todos

When removing todos, we also want to update our cache. Add a [MobX action](https://mobx.js.org/refguide/action.html):

```typescript
@action.bound public async delete(id: string) {
    await this.controller.delete(id);
    this.todos.delete(id);
}
```

### Checking todos

When checking todos, we also want to update our cache. Add a [MobX action](https://mobx.js.org/refguide/action.html):

```typescript
@action.bound public async check(id: string) {
    const updatedTodo = await this.controller.update(id, { checked: !this.byId(id).checked });
    this.todos.set(id, updatedTodo);
}
```

### Summary

Your store should look like this now:

```typescript
import { component, inject, initialize } from "tsdi";
import { observable, action, computed } from "mobx";
import { Todo, TodosController } from "../../common";

@component
export class TodosStore {
    @inject private controller: TodosController;

    @observable private todos = new Map<string, Todo>();

    @initialize
    protected async initialize() {
        const todos = await this.controller.list();
        todos.forEach(todo => this.todos.set(todo.id, todo));
    }

    public byId(id: string) { return this.todos.get(id); }

    @computed public get all() { return Array.from(this.todos.values()); }

    @action.bound public async delete(id: string) {
        await this.controller.delete(id);
        this.todos.delete(id);
    }

    @action.bound public async create(todo: Todo) {
        const newTodo = await this.controller.create(todo);
        this.todos.set(todo.id, todo);
    }

    @action.bound public async check(id: string) {
        const updatedTodo = await this.controller.update(id, { checked: !this.byId(id).checked });
        this.todos.set(id, updatedTodo);
    }
}
```

Currently it only wraps most of the controller's methods which might seem quite overheady, [which is why this can be automated](#automatically).

## Automatically

Depending on the controller's methods, [hyrest-mobx](https://www.npmjs.com/package/hyrest-mobx) can generate parts of the store for you.
When implementing any of the following traits on the controller, a corresponding methods will be available in the generated store base class:

- Creating: `create(model: Partial<TModel>): Promise<TModel>;` will add a `create` action.
- Reading: `get(id: TKey): Promise<TModel>;` will add a `get` and a `getLazy` action.
- Updating: `update(id: TKey, model: Partial<TModel>): Promise<TModel>;` will add an `update` action.
- Deleting: `delete(id: TKey): Promise<void>;` will add a `delete` action.
- Listing: `list(): Promise<TModel[]>;` will add a `list` action.
- Searching: `search(...args: TQuery): Promise<TModel[]>;` will add a `search` action.

### Basic store

Much like when implementing the store [manually](#manually), an empty component class with an injected controller is needed.
The controller needs to be injected and the property needs to be named `controller` as the base class which will be extended will use that property to perform the network operations.


```typescript
import { component, inject } from "tsdi";
import { TodosController } from "../../common";

@component
export class TodosStore {
    @inject protected controller: TodosController;
}
```

Import the `Store` utility from [hyrest-mobx](https://www.npmjs.com/package/hyrest-mobx), pass it the controller class and extend it:

```typescript
import { component, inject } from "tsdi";
import { Store } from "hyrest-mobx";
import { TodosController } from "../../common";

@component
export class TodosStore extends Store(TodosController) {
    @inject protected controller: TodosController;
}
```

Check your IDEs autocompletion: All methods we implemented in the controller are now also available in the store.
These methods will automatically keep the [ES6 Map](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Map) `entities` up-to-date.

### Loading the todos

At application startup, the todos should be loaded.
For this, add an asynchronous [initialize lifecycle hook](https://tsdi.js.org/docs/en/features.html#lifecycle-methods) in which the stores's `list()` method is called.
Doing that will load all todos from the controller and add them to the cache.

```typescript
@initialize
protected async initialize() {
    await this.list();
}
```

### Checking todos

All other operations we earlier implemented [manually](#manually) part are available through the generated base class as they are basic operations.
Checking todos is not a basic operation and hence needs to be implemented:

```typescript
@action.bound public async check(id: string) {
    return await this.update(id, { checked: !this.byId(id).checked });
}
```

### Summary

Your store should look like this now:

```typescript
import { component, inject, initialize } from "tsdi";
import { observable, action, computed } from "mobx";
import { Store } from "hyrest-mobx";
import { Todo, TodosController } from "../../common";

@component
export class TodosStore extends Store(TodosController){
    @inject protected controller: TodosController;

    @initialize
    protected async initialize() {
        await this.list();
    }

    @action.bound public async check(id: string) {
        return await this.update(id, { checked: !this.byId(id).checked });
    }
}
```

Inferring the store from the controller can save a lot of time and code.
