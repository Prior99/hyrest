---
id: tutorial-todo-store
title: 13. Todo Store
---

The frontend has to maintain a cached version of all known todos it has ever encountered.
For this, create a directory `src/web/store` and place a file called `todos.ts` into it.
This file will provide the state-management related to all `Todo` instances.
It will perform the calls to the controller and expresses the frontend's part of the application logic.

## Basic store

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

## Observable map

We will load all todos at startup and keep them in an [ES6 Map](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Map).
In general, you should aim to keep your state normalized at all times.
Hence the map will have the todo's ids as keys and the corresponding todo instances as values.

> We are not dealing with Redux here, but I very much recommend reading its [guide about normalized state](https://redux.js.org/recipes/structuringreducers/normalizingstateshape).
> It's a very helpful pattern and applies to all state-management, not just to Redux.

As we are using MobX, decorate the map with [@observable](https://mobx.js.org/refguide/observable.html):

```typescript
@observable private todos = new Map<string, Todo>();
```

## Loading the todos

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

## Accessing the todos

We could simply make the `todos` map public and expose it, but I suggest keeping our component [encapsulated](https://en.wikipedia.org/wiki/Encapsulation_(computer_programming)).

Add a method for getting one single todo by id:

```typescript
public byId(id: string) { return this.todos.get(id); }
```

Also add a [@computed](https://mobx.js.org/refguide/computed-decorator.html) getter for listing all todos.

```typescript
@computed public get all() { return Array.from(this.todos.values()); }
```

## Creating new todos

When creating new todos, we also want to update our cache. Add a [MobX action](https://mobx.js.org/refguide/action.html):

```typescript
@action.bound public async create(todo: Todo) {
    const newTodo = await this.controller.create(todo);
    this.todos.set(todo.id, todo);
}
```

## Removing todos

When removing todos, we also want to update our cache. Add a [MobX action](https://mobx.js.org/refguide/action.html):

```typescript
@action.bound public async remove(id: string) {
    await this.controller.remove(id);
    this.todos.delete(id);
}
```

## Checking todos

When checking todos, we also want to update our cache. Add a [MobX action](https://mobx.js.org/refguide/action.html):

```typescript
@action.bound public async check(id: string) {
    const updatedTodo = await this.controller.check(id);
    this.todos.set(id, updatedTodo);
}
```

## Summary

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

    @action.bound public async remove(id: string) {
        await this.controller.remove(id);
        this.todos.delete(id);
    }

    @action.bound public async create(todo: Todo) {
        const newTodo = await this.controller.create(todo);
        this.todos.set(todo.id, todo);
    }

    @action.bound public async check(id: string) {
        const updatedTodo = await this.controller.check(id);
        this.todos.set(id, updatedTodo);
    }
}
```

Currently it only wraps most of the controller's methods which might seem quite overheady, but this is where your frontend's logic will be added and thous it needs to be scalable.
