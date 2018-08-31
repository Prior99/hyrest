---
id: tutorial-database-setup
title: 7. Database setup
---

One part is still missing: The database needs to be configured.

## Create a Postgres database

[Create a new Postgres database](https://wiki.postgresql.org/wiki/Detailed_installation_guides).
If you already have a running Postgres server on your machine, this might be as simple as:

```sh
createdb todos
```

## Create a database factory

TSDI has support for injecting components which are not using TSDI themself.
TSDI has a feature called [Factories](https://tsdi.js.org/docs/en/features.html#factories) for this.
Create a new directory `src/server/factories` and add a file `database.ts` to it with an empty factory:

```typescript
import { component, factory } from "tsdi";
import { Connection } from "typeorm";

@component({ eager: true })
export class DatabaseFactory {

    @factory
    public getConnection(): Connection {
        return;
    }
}
```

In an `@initialize` lifecycle-hook we will create a new instance of a database connection and store it in our factory.
The `getConnection` method, which is called for each injection will the return it.
Take a look at [Typeorm's description for creating a connection](http://typeorm.io/#/connection/creating-a-new-connection).

For setting up the database, an array of all models will be needed.
To keep the knowledge where it belongs, export an array called `allModels` in `src/common/models/index.ts`:

```typescript
export * from "./todo";
import { Todo } from "./todo";

export const allModels = [ Todo ];
```

> If you later plan to add models which are only used by Hyrest but not by Typeorm, you could export two arrays here: `allModels` and `allDatabaseModels`.

Use a basic configuration for your database:

```json
{
    "database": "todos",
    "entities": [ ... ],
    "type": "postgres",
    "synchronize": true,
    "logging": true,
}
```

> Never use `synchronize` on production ([See here](http://typeorm.io/#/connection-options)). Use proper [migrations](http://typeorm.io/#/migrations) instead.

Add the configuration to your factory, store the created instance and return it in `getConnection()`.

```typescript
import { component, factory, initialize } from "tsdi";
import { Connection, createConnection } from "typeorm";
import { allModels } from "../../common";

@component({ eager: true })
export class DatabaseFactory {
    private connection: Connection;

    @initialize
    private async initialize() {
        this.connection = await createConnection({
            database: "todos",
            entities: allModels,
            type: "postgres",
            synchronize: true,
            logging: true,
        });
    }


    @factory
    public getConnection(): Connection {
        return this.connection;
    }
}
```

### Make factory discoverable by TSDI

As you already know, TSDI can only manage components which were imported at some point.
Import the factories in `src/server/index.ts`:

```typescript
import { TSDI } from "tsdi";
import "./server";
import "./factories";

const tsdi = new TSDI();
tsdi.enableComponentScanner();
```
