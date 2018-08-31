---
id: api-routes-controllers
title: Routes and controllers
---

Controllers bundle Routes. Routes can only be defined within controllers.
Defining a controller and a route is as simple as:

```typescript
import { controller, route, param, body, ok, created, notFound, conflict } from "hyrest";

@controller()
class UserController {
    @route("GET", "/user/:id")
    public async getUser(@param("id") id: string) {
        const user = ...;
        if (!user) {
            return notFound("No such user exists.")
        }
        return ok(user);
    }

    @route("POST", "/user")
    public async createUser(@body() user: User) {
        const newUser = ...;
        if (!newUser) {
            return conflict("User already exists.")
        }
        return created(user);
    }
}
```

In the browser calling the route is as easy as:

```typescript
const controller = new UserController();
await controller.getUser("the-id-of-some-user");
```

All the HTTP calls will happen automatically.
Of course the methods can still be used within the backend itself, without an HTTP
request happening.

## Controller configuration

Controller's take an optional configuration object as a parameter: `@controller(options)`.

| Option       | used by     | type                            | example                     | default    |
|--------------|-------------|---------------------------------|-----------------------------|------------|
| mode         | both        | ControllerMode                  | ControllerMode.CLIENT       | Autodetect |
| throwOnError | client only | boolean                         | true                        | true       |
| errorHandler | client only | function(error: Error) { ... }  | (err) => console.error(err) | undefined  |
| baseUrl      | client only | string                          | http://example.com          | undefined  |

It is also possible to configure a controller manually later using `configureController`:

```typescript
import { configureController, ControllerMode } from "hyrest";

configureContoller(UserController, { mode: ControllerMode.CLIENT, ...  });
```

Please note that the `class` is passed and not an `instance` as the configuration is always
applying to all instances of a controller class.

> [configureController](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#configurecontroller) can also take an array of controllers as a first argument. It will then apply the configuration to all controllers.


### ControllerOptions.mode

Can be `ControllerMode.CLIENT` or `ControllerMode.server`. This forces the controller to act as a
client or a server. This should not be necessary: By default when running in Node
`ControllerMode.SERVER` will be used, and when running in the browser it's `ControllerMode.CLIENT`.

### ControllerOptions.throwOnError

This option is only relevant to the client. If set to `true` and a non-2xx HTTP status code is
received, an `ApiError` will be thrown. The same is true for network connection errors or
undeserializable bodies.

### ControllerOptions.errorHandler

If set, this handler will be called for all errors which would be thrown if `throwOnError` is set to
`true`.

### ControllerOptions.baseUrl

This option is only relevant to the client. It should be set in order to tell the client how to
reach the backend.

## Route configuration

A route can be defined using the `@route` decorator. It takes two arguments: The HTTP method and
[an express compatible URL pattern](https://www.npmjs.com/package/path-to-regexp).

The URL parameters, query parameters and the body can be injected into the arguments of the 
route's method by using the `@param` (URL parameter), `@query` (query parameter) and `@body`
decorators.

Both `@param` and `@query` taken the name for the parameter as an argument, so if the URL is
defined as `/user/:id/game/:gameId` and is called with an URL like:
`http://example.com/user/891/game/15532?search=cards&page=3&count=100`

Then a route could take the parameters like this:

```typescript
import { param, query, controller, ok } from "hyrest";

@controller()
class UserController {
    @route("GET", "/user/:id/game/:gameId")
    public async getGame(
            @param("id") id: string,
            @param("gameId") gameId: string,
            @query("search") search: string,
            @query("page") page: string,
            @query("count") count: string) {
        console.log(id); // 891
        console.log(gameId); // 15532
        console.log(search); // cards
        console.log(page); // 3
        console.log(count); // 100
        return  ok();
    }
}
```

It is possible to automatically perform a [schema validation ](#schema-validation) and [populate
the parameter with the correct type](#populating) limited to a [scope](#scopes) with only `@body`:

```typescript
...
@route("POST", "/signup")
public async postSignup(@body(signupScope) user: User) {
    // `user` is now validated against `User` and a propert instance of `User`.
}
```

The other direction can also be automated. Call `.dump(Type, scope)` on the route decorator to have
it be automatically populated on the client side and safely dumped on the server side:

```typescript
...
@route("POST", "/signup").dump(User, signupScope)
public async postSignup(@body(signupScope) user: User) {
}

// When this route is called on the frontend, the returned value is actually a `User`.
```