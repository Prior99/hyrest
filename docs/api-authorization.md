---
id: api-authorization
title: Authorization
---

Authorization is a necessary part of almost any REST server.
Hyrest solves authorization by providing two decorators: [@auth](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#auth) and [@noauth](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#noauth).
When initially configuring your [Hyrest Express middleware](https://www.npmjs.com/hyrest-express), you can [decide](https://prior99.gitlab.io/hyrest/api/hyrest-express/interfaces/hyrestbuilder.html#authorization) whether you want all routes to be protected by authorization by default or not.

## Authorization Configuration

Authorization can be configured on:

 - Each route
 - Each controller
 - The middleware

In each instance, authorization can be switched to `AuthorizationMode.NOAUTH` or
`AuthorizationMode.AUTH`.

If something is configured to be `NOAUTH` it does not require authorization and no
authorization will be performed.

If something is configured to be `AUTH` it does require authorization and an authorization
check will be performed.

### On a Route

You can configure each route individually to be `AUTH` or `NOAUTH`.

The `@authorized` decorator can mark any route or controller as requiring authorization:

```typescript
import { authorized, unauthorized, controller, route, ok } from "hyrest";

@controller
class controller {
    @route("get", "/test") @authorized
    public async method() {
        return ok();
    }
}
```

Respectively, `@unauthorized` excludes the route or controller from authorization.

The configuration of route take the highest precedence, overriding the controller's and middleware's
configuration.

### On a Controller

A whole controller can be configured to require authorization or be excluded from it. The controller's
configuration will be applied to all routes which are not configured explicitly. It overrides the
middleware's configuration:

```typescript
import { authorized, unauthorized, controller } from "hyrest";

@controller @authorized
class controller {
}
```

### On the middleware

It is possible to configure the default authorization mode on the express middleware
if nothing is configured on either the controller or route. By default, it is set to `NOAUTH`.

```typescript
import { AuthorizationMode } from "hyrest";

...

middleware.defaultAuthorizationMode(AuthorizationMode.AUTH);
```

### Extra checks

Each `@auth` decorator can be configured to take an extra check:

```typescript
import { auth, controller, route, ok } from "hyrest";

@controller
class Controller {
    @route("get", "/test") @auth({ check: (request, context) => false })
    public async method() {
        return ok();
    }
}
```

If it returns `true` the route will be authorized, otherwise not.

The check is performed in addition to the check from the middleware.

## Configuring the server

If the server encounters an authorized route, a checker must be configured.
A checker will receive [Express's](http://expressjs.com/de/api.html#req) as the first,
and the [context](#context) as the second argument. It should return `true` or `false`,
with `true` meaning that the access should be allowed and `false` meaning, that a `401 UNAUTHORIZED`
should be returned.

```typescript
middleware.authorization(async (request, context) => {
    return request.headers["authorization"] === await context.db.getAuthorizationToken();
});
```

## Configuring the client

A provider for the authorization can be configured in the client by configuring the controllers:

```typescript
import { authorized, controller, route, ok, configureController } from "hyrest";

@controller
class Controller {
    ...
}

configureController(Controller, {
    authorizationProvider: (headers: Headers, currentBody: any, currentQuery: Params) => {
        currentQuery["authorization"] = "secret-key-in-the-query";
        currentBody.authorizationKey = "some-secret-key-on-the-body";
        headers.append("authorization", "Bearer secret-key-in-the-headers");
    },
});
```

It will receive the headers, body and query as arguments and can mutate them to provide an
secret token or such.
