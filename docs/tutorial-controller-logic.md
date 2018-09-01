---
id: tutorial-controller-logic
title: 4. Implement controller logic
---

Previously, an empty controller has been sketched.
The controller could already be used from the frontend when configured to work with an external API, as the method's bodies are never actually called.
For this project, let us fill the methods with life.

Assume for now, that a reference to an existing database connection exists on the controller:

```typescript
import { Connection } from "typeorm";
import { controller, route, body, param } from "hyrest";
import { Todo } from "../models";
import { createTodo } from "../scopes";

@controller
export class TodosController {
    private db: Connection;

    ...
}
```

## Create a new todo

Let us implement the `create` method of the controller.
The todo is already provided as the method's first argument.
We defined [the validation and data types](tutorial-models.md) when defining the model, so at this point the received data can safely be expected to be correct.
If the validation would have failed, the method's body wouldn't have been called at all and a "400 Bad request" status would have been returned.

Calls to the database are asynchronous, so the method will be marked as `async`.
After creating a new todo, the method should return the created `Todo`.
The method's signature will be adjusted accordingly:

```typescript
@route("POST", "/todos")
public async create(@body(createTodo) todo: Todo): Promise<Todo> {
}
```

Take a look at the [Typeorm documentation on inserting rows into the database](http://typeorm.io/#/repository-api) to better understand how the model is inserted.
Instead of directly returning the `Todo`, it is wrapped in `created()`, a utility function imported from Hyrest which will denote the [HTTP Status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) returned alongside the body.

The `@route` decorator will be extended by adding a `.dump(Todo, world)`. This will tell the Express middleware to serialize the `Todo` instance by using the `Todo` class as a schema and strip all properties not included in the `world` scope.

```typescript
@route("POST", "/todos").dump(Todo, world)
public async create(@body(createTodo) todo: Todo): Promise<Todo> {
    return created(await this.db.getRepository(Todo).save(todo));
}
```

## Listing all todos

For listing all todos in our database, let us first list all rows and then return them with the corresponding status code "200 OK".
[As already done in the last section](#create-a-new-todo), we need to tell Hyrest how to serialize the return value. Hence we add `.dump(Todo, world)` to the `@route` decorator.
Take a look at the [Typeorm documentation for the query builder](http://typeorm.io/#/select-query-builder) to better understand the Typeorm part of the implementation.

```typescript
@route("GET", "/todos").dump(Todo, world)
public async list(): Promise<Todo[]> {
    const todos = await this.db.getRepository(Todo).createQueryBuilder("todo")
        .where("todo.deleted is NULL")
        .orderBy("todo.created", "DESC")
        .getMany();
    return ok(todos);
}
```

## Deleting a todo

Todos will not really be deleted, but instead a timestamp will be set in the `deleted` column.
When listing the todos, all entries with a timestamp present in the `deleted` column will be ignored.


```typescript
@route("DELETE", "/todo/:id")
public async delete(@param("id") id: string): Promise<void> {
    if (!await this.db.getRepository(Todo).findOne(id)) {
        return notFound<void>("No such todo.");
    }
    await this.db.getRepository(Todo).update(id, { deleted: new Date() });
    return ok();
}
```

First, we check for the todo with the specified id to exist (This could also have been done using the `validateCtx` way on the model).
If not, `404 NOT FOUND` is returned as status with an error message in the body: `"No such todo."`.

> The cast to void is necessary due to typescripts limitations and the way the return values are handled in Hyrest.
> This is only needed when returning an error message on a bad status code instead of the real type specified in the method's signature.

## Reading a single todo by id

Retrieving an individual todo now seems rather simple:

1. Add `.dump(Todo, world)` to `@route` decorator.
2. Load todo from database.
3. Return `notFound<Todo>("...")` when todo was not found.
4. return todo with "200 OK" status code if present.

```typescript
@route("GET", "/todo/:id").dump(Todo, world)
public async get(@param("id") id: string): Promise<Todo> {
    const todo = await this.db.getRepository(Todo).findOne(id);
    if (!todo) {
        return notFound<Todo>("No such todo.");
    }
    return ok(todo);
}
```

## Checking a todo

Last but not least it needs to be possible to check and uncheck a todo.
This route accepts a `patch` argument which will be used to update the entity in the database.
We can now reuse what we already implemented [above](#reading-a-single-todo-by-id), by utilizing Hyrest's hybrid approach:

```typescript
@route("POST", "/todo/:id").dump(Todo, world)
public async update(@param("id") id: string, @body(updateTodo) patch: Todo): Promise<Todo> {
    const todo = await this.db.getRepository(Todo).findOne(id);
    if (!todo) {
        return notFound<Todo>("No such todo.");
    }
    await this.db.getRepository(Todo).update(id, patch);
    return ok(await this.get(id));
}
```

Here we call the method internally and no REST call is performed.

## Summary

The controller now looks like this:

```typescript
import { Connection } from "typeorm";
import { controller, route, body, param, created, ok, notFound } from "hyrest";
import { Todo } from "../models";
import { createTodo, world } from "../scopes";

@controller
export class TodosController {
    private db: Connection;

    @route("POST", "/todos").dump(Todo, world)
    public async create(@body(createTodo) todo: Todo): Promise<Todo> {
        return created(await this.db.getRepository(Todo).save(todo));
    }

    @route("GET", "/todos").dump(Todo, world)
    public async list(): Promise<Todo[]> {
        const todos = await this.db.getRepository(Todo).createQueryBuilder("todo")
            .where("todo.deleted is NULL")
            .orderBy("todo.created", "DESC")
            .getMany();
        return ok(todos);
    }

    @route("DELETE", "/todo/:id")
    public async delete(@param("id") id: string): Promise<void> {
        if (!await this.db.getRepository(Todo).findOne(id)) {
            return notFound<void>("No such todo.");
        }
        await this.db.getRepository(Todo).update(id, { deleted: new Date() });
        return ok();
    }

    @route("GET", "/todo/:id").dump(Todo, world)
    public async get(@param("id") id: string): Promise<Todo> {
        const todo = await this.db.getRepository(Todo).findOne(id);
        if (!todo) {
            return notFound<Todo>("No such todo.");
        }
        return ok(todo);
    }

    @route("POST", "/todo/:id").dump(Todo, world)
    public async check(@param("id") id: string, @body(updateTodo) patch: Todo): Promise<Todo> {
        const todo = await this.db.getRepository(Todo).findOne(id);
        if (!todo) {
            return notFound<Todo>("No such todo.");
        }
        await this.db.getRepository(Todo).update(id, patch);
        return ok(await this.get(id));
    }
}
```
