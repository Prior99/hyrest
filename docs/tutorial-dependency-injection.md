---
id: tutorial-dependency-injection
title: 5. Dependency injection
---

Dependency injection is the backbone and the wiring of your application in the background.
Take a look at the [documentation for TSDI](https://tsdi.js.org/) to better understand what is done below.

## Make the controller a component

We will inject the controller [we just implemented](tutorial-controller-logic) into stores, components and the server later.
To have the controller managed by TSDI, we need to make it a "component".

> The name "component" is ambiguous with "component" in the terms of frontend UI components.
> TSDI also calls classes which are injectable "component".

To do so, we decorate it with `@component`:

```typescript
import { Connection } from "typeorm";
import { controller, route, body, param, created, ok, notFound } from "hyrest";
import { component } from "tsdi";
import { Todo } from "../models";
import { createTodo, world } from "../scopes";

@controller
export class TodosController {
    ...
}
```

## Inject the database

TSDI also handles how the database can be available in the controllers for us. Use `@inject` to decorate the `db` property on the controller.
This will tell TSDI to find a component of type `Connection` and inject it into the controller once it's needed:

```typescript
import { Connection } from "typeorm";
import { controller, route, body, param, created, ok, notFound } from "hyrest";
import { component, inject } from "tsdi";
import { Todo } from "../models";
import { createTodo, world } from "../scopes";

@controller
export class TodosController {
    @inject private db: Connection;
    ...
}
```

## Server startup

Create a new directory `src/server` for the server's logic to live in.
Create a file `index.ts` in it which will handle startup of the server for us:

```typescript
import { TSDI } from "tsdi";

const tsdi = new TSDI();
tsdi.enableComponentScanner();
```

Nothing more is neccessary. Take a look at [TSDI's component scanner](https://tsdi.js.org/docs/en/features.html#component-scanner) for better understanding.
