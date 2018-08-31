---
id: api-server
title: Usage as server
---

Use the [hyrest](https://prior99.gitlab.io/hyrest/api/hyrest-express/globals.html#hyrest) middleware from the [hyrest-express package](https://www.npmjs.com/package/hyrest-express) to connect your controllers to [Express](http://expressjs.com):

```typescript
import { hyrest } from "hyrest-express";
import * as Express from express;
import * as BodyParser from "body-parser";
import { UserController } from "./user-controller";
import { GameController } from "./game-controller";

const app = Express();
app.use(Bodyparser.json());
app.use(hyrest(
    new UserController(),
    new GameController(),
));

app.listen(3000);
```

Everything else happens automatically.

## Context

It is possible to inject a context into each route on the server side.
This context can be created by a factory or simply specified as an object or instance.
It could carry the database connection, a property with the current user from the database, a unique id for this request or anything else.

Specify the context by calling [context](https://prior99.gitlab.io/hyrest/api/hyrest-express/interfaces/hyrestbuilder.html#context) on the middleware:

```typescript
const anObject = {
    database: ...
};

middleware.context(anObject)
```

Or as a factory:

```typescript
middleware.context(async (request) => {
    return {
        url: request.url,
        headers: request.headers,
        database: await connect()
    };
});
```

The context can then be used in a [context validation](api-validation#context-sensitive-validation.md) or injected as an argument using [@context](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#context):

```typescript
@route("GET", "/user/:id")
public async getUser(@param("id") id: string, @context ctx?: any)
```

It can afterwards be used in the route method.
It is recommended to make the context argument an optional argument to be able to skip it when calling the route from the frontend.

## Authorization

[Authorization](api-authorization.md) comes in two modes in Hyrest:

1. All routes are protected by default.
2. No routes are protected by default.

This can be configured by [setting the default authorization mode](https://prior99.gitlab.io/hyrest/api/hyrest-express/interfaces/hyrestbuilder.html#defaultauthorizationmode) on the middleware:

```typescript
middleware.defaultAuthorizationMode(AuthorizationMode.AUTH);
```

[A callback performing the actual authorization](https://prior99.gitlab.io/hyrest/api/hyrest-express/interfaces/hyrestbuilder.html#defaultauthorizationmode) can be provided as explained in [Authorization](api-authorization.md).

