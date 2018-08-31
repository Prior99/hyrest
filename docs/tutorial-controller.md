---
id: tutorial-controller
title: 3. Add a controller
---

The model only defines the shape of the data to store. In order to do something with it, we need a controller.
It can be a good pattern to create one controller per model and supply the basic [CRUD operations](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete).

Let's create a controller for dealing with Todo models. Creating a controller is as simple as creating a new class and decorating it with `@controller`.

## Empty class

Add an empty decorated class in `src/common/controllers/todos.ts`:

```typescript
import { controller } from "hyrest";

@controller
export class TodosController {

}
```

## Methods

For now, operations for creating, deleting, listing and checking todos should suffice.
The operation for creating a new todo will take a "prototypical" todo as argument.
As we made all properties on the `Todo` class optional earlier, we can simply use `Todo` as interface.

> I tend to create `index.ts` files simply proxy-exporting everything from within the same directory to keep the governance of the nested directory structure independent.
> Create a `index.ts` file inside `src/common/models` and add `export * from "./todo";` to it, or import the model directly from the `todo.ts` file.

After creating all methods, the controller should look like this:

```typescript
import { controller } from "hyrest";
import { Todo } from "../models";

@controller
export class TodosController {
    public async create(todo: Todo): Promise<Todo> {
        return;
    }

    public async list(): Promise<Todo[]> {
        return;
    }

    public async remove(id: string): Promise<void> {
        return;
    }

    public async byId(id: string): Promise<Todo> {
        return;
    }

    public async check(id: string): Promise<Todo> {
        return;
    }
}
```

## Create routes from methods

In order to make the methods callable via REST, we need to decorate them with `@route`:

```typescript
import { controller, route } from "hyrest";
import { Todo } from "../models";

@controller
export class TodosController {
    @route("POST", "/todos")
    public async create(todo: Todo): Promise<Todo> {
        return;
    }

    @route("GET", "/todos")
    public async list(): Promise<Todo[]> {
        return;
    }

    @route("DELETE", "/todo/:id")
    public async remove(id: string): Promise<void> {
        return;
    }

    @route("GET", "/todo/:id")
    public async byId(id: string): Promise<Todo> {
        return;
    }

    @route("POST", "/todo/:id/check")
    public async check(id: string): Promise<Todo> {
        return;
    }
}
```

## Inject arguments

In addition to defining the routes, the parameters as for example the `:id` from the URL or the todo prototype in the `create` method need to be inject somehow.
For the URL parameters `@param` can be used, the body can be injected via `@body`.

```typescript
import { controller, route, body, param } from "hyrest";
import { Todo } from "../models";
import { createTodo } from "../scopes";

@controller
export class TodosController {
    @route("POST", "/todos")
    public async create(@body(createTodo) todo: Todo): Promise<Todo> {
        return;
    }

    @route("GET", "/todos")
    public async list(): Promise<Todo[]> {
        return;
    }

    @route("DELETE", "/todo/:id")
    public async remove(@param("id") id: string): Promise<void> {
        return;
    }

    @route("GET", "/todo/:id")
    public async byId(@param("id") id: string): Promise<Todo> {
        return;
    }

    @route("POST", "/todo/:id/check")
    public async check(@param("id") id: string): Promise<Todo> {
        return;
    }
}
```

The arguments for the `@param("id")` decorators identify the part of the route defined in the corresponding `@route` decorator.
The scope `createTodo` is supplied to the `@body` decorator as only the properties within that scope are valid for this route.
