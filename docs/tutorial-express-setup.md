---
id: tutorial-express-setup
title: 6. Setup Express
---

[The controller](tutorial-controller-logic.md) we just implemented can now be used to serve the backend.
For this, we need to setup a simple [Express](https://expressjs.com/) application and mount the Hyrest middleware in it.

## Create class for server

As we will be using [dependency injection](tutorial-dependency-injection.md) to handle startup and teardown of the server later, we will implement the server in a class.
Create a new file in `src/server/` called `server.ts` and add an empty class with some Express boilerplate already present:

```typescript
import * as Express from "express";
import * as BodyParser from "body-parser";

export class Server {
    private app: Express.Application;

    public initialize() {
        this.app = Express();
        this.app.use(BodyParser.json());
        this.app.use(BodyParser.urlencoded({ extended: true }));
        this.app.listen(4000);
    }
}
```

## Connect to TSDI

We have to make the server an [eager component](https://tsdi.js.org/docs/en/features.html#eager-components) to make sure it starts up automatically when encountered.
To have the code in the `initialize` method executed when the component is created, decorate it with [@initialize](https://tsdi.js.org/docs/en/features.html#lifecycle-methods).

```typescript
import * as Express from "express";
import * as BodyParser from "body-parser";
import { component, initialize } from "tsdi";

@component({ eager: true })
export class Server {
    private app: Express.Application;

    @initialize
    public initialize() {
        this.app = Express();
        this.app.use(BodyParser.json());
        this.app.use(BodyParser.urlencoded({ extended: true }));
        this.app.listen(4000);
    }
}
```

TSDI will only know about components if they are at least once imported.
Import the server in `src/server/index.ts`:

```typescript
import { TSDI } from "tsdi";
import "./server";

const tsdi = new TSDI();
tsdi.enableComponentScanner();
```

## Add Hyrest's controllers to Express

Import the [Hyrest middleware for express](https://www.npmjs.com/package/hyrest-express) and give it an array of all controller's instances.
To keep knowledge where it belongs, add an export `allControllers` to `src/controllers/index.ts` which is simply an array with all controllers:

```typescript
export * from "./todos";
import { TodosController } from "./todos";

export const allControllers = [ TodosController ];
```

Now import that array in our server class and use [tsdi.get](https://tsdi.js.org/docs/en/getting-started.html#start-using-your-components) to get their instances:

```typescript
const controllers = allControllers.map(controllerClass => this.tsdi.get(controllerClass));
}
```

> You can use TSDI's feature for self-injection to gain access to the TSDI instance managing your application: `@inject private tsdi: TSDI;`.

With the controller instances available, we can mount the hyrest middleware:

```typescript
this.app.use(hyrest(...controllers));
```

The server class should now look like this:

```typescript
import * as Express from "express";
import * as BodyParser from "body-parser";
import { hyrest } from "hyrest-express";
import { component, initialize, inject, TSDI } from "tsdi";
import { allControllers } from "../common";

@component({ eager: true })
export class Server {
    @inject private tsdi: TSDI;

    private app: Express.Application;

    @initialize
    public initialize() {
        this.app = Express();
        this.app.use(BodyParser.json());
        this.app.use(BodyParser.urlencoded({ extended: true }));

        const controllers = allControllers.map(controllerClass => this.tsdi.get(controllerClass));
        this.app.use(hyrest(...controllers));

        this.app.listen(4000);
    }
}
```
