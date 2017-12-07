# Hyrest

[![npm](https://img.shields.io/npm/v/hyrest.svg)](https://www.npmjs.com/package/hyrest)
[![Build Status](https://travis-ci.org/Prior99/hyrest.svg?branch=master)](https://travis-ci.org/Prior99/hyrest)
[![Coverage Status](https://coveralls.io/repos/github/Prior99/hyrest/badge.svg?branch=master)](https://coveralls.io/github/Prior99/hyrest?branch=master)

Hyrest is a hybrid REST framework for both the client and the server.

The idea is to define routes using decorators and use them to both serve the REST endpoint
and call them from the frontend. When developing both server and client in the same repository
or sharing a common library with all endpoints between the both, a call to a REST endoint
is transparent, type-safe and as easy calling a method.

## Table of contents

 * [Hyrest](#hyrest)
     * [Table of contents](#table-of-contents)
     * [Routes and Controllers](#routes-and-controllers)
         * [Controller configuration](#controller-configuration)
             * [ControllerOptions.mode](#controlleroptionsmode)
             * [ControllerOptions.throwOnError](#controlleroptionsthrowonerror)
             * [ControllerOptions.errorHandler](#controlleroptionserrorhandler)
             * [ControllerOptions.baseUrl](#controlleroptionsbaseurl)
         * [Route configuration](#route-configuration)
         * [Context](#context)
     * [Validation](#validation)
         * [Parameters](#parameters)
         * [Advanced Validation](#advanced-validation)
         * [Schema Validation](#schema-validation)
         * [What happens when Validation Fails?](#what-happens-when-validation-fails)
         * [Custom Validators](#custom-validators)
         * [How about validation against my database?](#how-about-validation-against-my-database)
         * [How about validation against my database from the frontend?](#how-about-validation-against-my-database-from-the-frontend)
         * [What if I need to access my application's context from my validator?](#what-if-i-need-to-access-my-applications-context-from-my-validator)
     * [Authorization](#authorization)
         * [Authorization Configuration](#authorization-configuration)
             * [Authorization on a Route](#authorization-on-a-route)
             * [Authorization on a Controller](#authorization-on-a-controller)
             * [Authorization on the middleware](#authorization-on-the-middleware)
             * [Extra checks](#extra-checks)
         * [Configuring the server for Authorization](#configuring-the-server-for-authorization)
         * [Configuring the client for Authorization](#configuring-the-client-for-authorization)
     * [Usage as express middleware](#usage-as-express-middleware)
     * [Usage as client](#usage-as-client)
     * [Scopes](#scopes)
         * [Dumping](#dumping)
         * [Nested Objects](#nested-objects)
         * [Populating](#populating)
             * [Populating Arrays](#populating-arrays)
             * [A word on validation](#a-word-on-validation)
     * [Contributing](#contributing)
         * [Building](#building)
         * [Running the tests with coverage](#running-the-tests-with-coverage)
         * [Linting](#linting)
         * [Starting the example](#starting-the-example)
     * [Contributors](#contributors)

## Routes and Controllers

Controllers bundle Routes. Routes can only be defined within controllers.

Defining a controller and a route is as simple as:

```typescript
import { controller, route, param, body, ok, created, notFound, conflict } from "hyrest";

@controller()
class UserController {
    @route("GET", "/user/:id")
    public getUser(@param("id") id: string) {
        const user = ...;
        if (!user) {
            return notFound("No such user exists.")
        }
        return ok(user);
    }

    @route("POST", "/user")
    public createUser(@body() user: User) {
        const newUser = ...;
        if (!newUser) {
            return conflict("User already exists.")
        }
        return created(user);
    }
}
```

### Controller configuration

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


#### ControllerOptions.mode

Can be `ControllerMode.CLIENT` or `ControllerMode.server`. This forces the controller to act as a
client or a server. This should not be necessary: By default when runnning in Node
`ControllerMode.SERVER` will be used, and when running in the browser it's `ControllerMode.CLIENT`.

#### ControllerOptions.throwOnError

This option is only relevant to the client. If set to `true` and a non-2xx HTTP status code is
received, an `ApiError` will be thrown. The same is true for network connection errors or
undeserializable bodies.

#### ControllerOptions.errorHandler

If set, this handler will be called for all errors which would be thrown if `throwOnError` is set to
`true`.

#### ControllerOptions.baseUrl

This option is only relevant to the client. It should be set in order to tell the client how to
reach the backend.

### Route configuration

A route can be defined using the `@route` decorator. It takes two arguments: The HTTP method and
[an express compatible url pattern](https://www.npmjs.com/package/path-to-regexp).

The url parameters, query parameters and the body can be injected into the arguments of the 
route's method by using the `@param` (url parameter), `@query` (query parameter) and `@body`
decorators.

Both `@param` and `@query` taken the name for the parameter as an argument, so if the url is
defined as `/user/:id/game/:gameId` and is called with an url like:
`http://example.com/user/891/game/15532?search=cards&page=3&count=100`

Then a route could take the parameters like this:

```typescript
import { param, query, controller, ok } from "hyrest";

@controller()
class UserController {
    @route("GET", "/user/:id/game/:gameId")
    public getGame(
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
public postSignup(@body(signupScope) user: User) {
    // `user` is now validated against `User` and a propert instance of `User`.
}
```

The other direction can also be automated. Call `.dump(Type, scope)` on the route decorator to have
it be automatically populated on the client side and safely dumped on the server side:

```typescript
...
@route("POST", "/signup").dump(User, signupScope)
public postSignup(@body(signupScope) user: User) {
}

// When this route is called on the frontend, the returned value is actually a `User`.
```

### Context

It is possible to inject a context into each route on the server side. This context can be created by
a factory or simply specified as an object or instance. It could carry the database connection, a property
with the current user from the database, a unique id for this request or anything similar.

Specify the context by calling `.context()` on the [hyrest middleware](#usage-as-express-middleware):

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

The context can then be used in a [context validation](#how-about-validation-against-my-database) or
injected as an argument:

```typescript
@route("GET", "/user/:id")
public getUser(@param("id") id: string, @context ctx?: any)
```

It can afterwards be used in the route method. It is recommended to make the context argument an optional
one to be able to skip it when calling the route from the frontend.

## Validation

Of course it is important to validate all input. The library itself is typesafe but the REST
endpoint might be called by 3rd parties. Apart from that consistency checks are also necessary
in a typesafe environment.

### Parameters

Parameters can be validated and converted using the `@is` decorator like this:

```typescript
import { query, controller, ok, is, DataType } from "hyrest";

@controller()
class GameController {
    @route("GET", "/games")
    public listGames(@query("count") @is(DataType.int) count: number) {
        return ok([
            ...
        ]);
    }
}
```

When using an `@is` decorator with a datatype, the input is validated and automatically converted,
so in the example above `count` is of type number.

### Advanced Validation

In addition to validating the datatype and converting the input advanced validation can be
performed:

```typescript
import { query, controller, ok, is, DataType, required, oneOf } from "hyrest";

const categories = ["casual", "shooter", "simulation"];

@controller()
class GameController {
    @route("GET", "/games")
    public listGames(
            @query("category") @is(DataType.string).validate(oneOf(...categories)) category: string,
            @query("count") @is(DataType.int).validateOf(required) count: number,
            @query("page") @is(DataType.int).validateOf(required) page: number) {
        return ok([
            ...
        ]);
    }
}
```

### Schema Validation

It is possible to perform schema validation of object using the same infrastructure as for
parameters:

```typescript
import { controller, body, created, is, DataType, required, oneOf, schema } from "hyrest";

const categories = ["casual", "shooter", "simulation"];

interface User {
    firstName: string;
    lastName: string;
    favoriteGame: {
        category: string;
    },
    email: string;
    password: string;
}

const UserSchema = {
    firstName: is(DataType.str),
    lastName: is(DataType.str),
    favoriteGame: {
        category: is(DataType.str).validate(oneOf(...categories)),
    },
    email: is(DataType.str).validate(required),
    password: is(DataType.str).validate(required),
};

@controller()
class UserControllre {
    @route("POST", "/user")
    public createUser(@body() @is(DataType.obj).schema(UserSchema) user: User) {
        ...
        return created(user)
    }
}
```

Schemas can be generated from classes. The datatypes can be inferred from the typescript type.
In order to infer the data type from the property, simply omit the converter from the decorator.

```typescript
class Game {
    @is().validate(oneOf(...categories))
    public category: string;
}

class User {
    @is(DataType.int)
    public age: number;

    @is()
    public firstName: string;

    @is()
    public lastName: string;

    @is()
    public favoriteGame: Game;

    @is().validate(required)
    public email: string;

    @is().validate(required)
    public password: string;
}
```

Still, all properties included in the schema have to be included by decorating them with `@is`.
The schema can then be used by using `schemaFrom()`:

```typescript
@route("POST", "/user")
public createUser(@body() @is(DataType.obj).schema(schemaFrom(User)) user: User) {
    ...
```

This also works for arrays, however it is not possible to infer the array type from the property,
so `@specify` has to be used:

```typescript
class User {
    ...

    @is() @specify(() => Game)
    public games: Game[];

    ...
}
```

Together with [Scopes](#scopes) schemas can be validated against a subset of properties:

```typescript
const signup = createScope();

class User {
    @is()
    public firstName: string;

    @is()
    public lastName: string;

    @is().validate(required) @scope(signup)
    public email: string;

    @is().validate(required) @scope(signup)
    public password: string;
}
```

To limit the schema to properties marked with the scope `signup`, simply specify it:

```typescript
@route("POST", "/user")
public createUser(@body() @is(DataType.obj).schema(schemaFrom(User)).scope(signup) user: User) {
    ...
```

It is also possible to limit individual validators to certain scopes using `only`. Just wrap the
validator in `only`, specifying a scope:

```typescript
only(signup, email)
```

### What happens when Validation Fails?

When the validation fails a `422 UNPROCESSABLE ENTITY` is returned, containing a body with
`{ message: "Error message." }`. Only the first error message will be returned.

### Custom Validators

Validators are not black magic. It is easy to define custom validators and converters.

A new datatype can be introduced by implementing a function following this interface:

```typescript
interface Converted<T> {
    error?: string;
    value?: T;
}

type Converter<T> = (input: any) => Converted<T> | Promise<Converted<T>>;
```

The function should return an object with `{ value: convertedValue }` when the conversion
succeeded and `{ error: "Oh, no." }` when the input failed to be converted.

The `float` datatype looks like this for example:

```typescript
export function float(input: any): Converted<number> {
    if (typeof input === "undefined") { return { value: input }; }
    const value = parseFloat(input);
    if (isNaN(value)) { return { error: "Not a valid float." }; }
    return { value} ;
}
```

It is just as easy to add custom validators. The interface looks like this:

```typescript
interface Validation {
    error?: string;
}

type Validator<T> = (input: T) => Validation | Promise<Validation>;

```

It's very similar to introducing new datatypes. In case of success an empty object (`{}`)  is
returned, when an error occured, an error message should be provided.

```typescript
function required<T>(value: T): Validation {
    if (typeof value === "undefined" || value === null) { return { error: "Missing required field." }; }
    return {};
}
```

### How about validation against my database?

This is not a problem. All validators can be `async` or return `Promise`s. This way, a validator
might just as well perform a request against the database.

```typescript
function emailAvailable(value: string): Validation {
    if (typeof value === "undefined") { return {}; }
    const rows = await db.query("SELECT id FROM user WHERE email = ?", [ value ]);
    return rows.length === 0 ? {} : { error: "Email already taken." };
}
```

The validation can access the [context](#context):

```typescript
is(...).validateCtx(context => context.validation.emailAvailable)
```

### How about validation against my database from the frontend?

This is not a problem either:

```typescript
import { controller, route, body } from "hyrest";

@controller()
class ValidationController {
    @route("POST", "/validate/email")
    public validateEmail(@body() value: string) {
        if (typeof value === "undefined") { return {}; }
        const rows = await db.query("SELECT id FROM user WHERE email = ?", [ value ]);
        return rows.length === 0 ? {} : { error: "Email already taken." };
    }
}
```

Afterwards just use the method as a validator in any schema or decorator. The frontend will call
the REST endpoint and the server will perform the check on the database.

### What if I need to access my application's context from my validator?

Another method called `validateCtx` exists, which takes a factory with the context passed in as the
first argument. It is possible to specify the context by calling `.context(obj)` on the hyrest
middleware. This way a context object can be passed through to the validation.

```typescript
app.use(hyrest(...controllers).context({
    validator: (value: string) => {
        ...
    }
}));
```

The factory can either return an array of validators or a single validator.

```typescript
import { controller, route, body, DataType } from "hyrest";

@controller()
class SomeController {
    @route("POST", "/validate/email")
    public validateEmail(@body() @is(DataType.str).validateCtx(ctx => ctx.validator) value: string) {
        ...
    }
}
```

## Authorization

Authorization is a neccessary part of any REST server.

### Authorization Configuration

Authorization can be configured on:

 - Each route
 - Each controller
 - The middleware

In each instance, authorization can be switched to `AuthorizationMode.UNAUTHORIZED` or
`AuthorizationMode.AUTHORIZED`.

If something is configured to be `UNAUTHORIZED` it does not require authorization and no
authorization will be performed.

If something is configured to be `AUTHORIZED` it does require authorization and an authorization
check will be performed.

#### Authorization on a Route

You can configure each route individually to be `AUTHORIZED` or `UNAUTHORIZED`.

The `@authorized` decorator can mark any route or controller as requiring authorization:

```typescript
import { authorized, unauthorized, controller, route, ok } from "hyrest";

@controller
class controller {
    @route("get", "/test") @authorized
    public method() {
        return ok();
    }
}
```

Respectively, `@unauthorized` excludes the route or controller from authorization.

The configuration of route take the highest precedence, overriding the controller's and middleware's
configuration.

#### Authorization on a Controller

A whole controller can be configured to require authorization or be excluded from it. The controller's
configuration will be applied to all routes which are not configured explicitly. It overrides the
middleware's configuration:

```typescript
import { authorized, unauthorized, controller } from "hyrest";

@controller @authorized
class controller {
}
```

#### Authorization on the middleware

It is possible to configure the default authorization mode on [the middleware](#usage-as-express-middleware)
if nothing is configured on either the controller or route. By default, it is set to `UNAUTHORIZED`.

```typescript
import { AuthorizationMode } from "hyrest";

...

middleware.defaultAuthorizationMode(AuthorizationMode.AUTHORIZED);
```

#### Extra checks

Each `@authorization` decorator can be configured to take an extra check:

```typescript
import { authorized, controller, route, ok } from "hyrest";

@controller
class Controller {
    @route("get", "/test") @authorized({ check: (request, context) => false })
    public method() {
        return ok();
    }
}
```

If it returns `true` the route will be authorized, otherwise not.

The check is performed in addition to the check from the middleware.

### Configuring the server for Authorization

If the server encounters an authorized route, a checker must be configured.
A checker will receive [express's](http://expressjs.com/de/api.html#req) as the first,
and the [context](#context) as the second argument. It should return `true` or `false`,
with `true` meaning that the access should be allowed and `false` meaning, that a `403 UNAUTHORIZED`
should be returned.

```typescript
middleware.authorization(async (request, context) => {
    return request.headers["authorization"] === await context.db.getAuthorizationToken();
});
```

### Configuring the client for Authorization

A provider for the authorization can be configured in the client by configuring the cointrollers:

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
secret token or therelike.

## Usage as express middleware

Use the `hyrest` middleware to connect your controllers to express:

```typescript
import { hyrest } from "hyrest/middleware";
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

Everything else hapens magically.
**The middleware needs to be directly imported from `hyrest/middleware` in order to keep the overall bundle
independent from express.**

## Usage as client

Just configure the controller and create an instance in any way:

```typescript
import { configureController } from "hyrest";
import { UserController } from "./user-controller";
import { GameController } from "./game-controller";

const options = { baseUrl: "http://localhost:3000" };

configureController(UserController, options);
configureController(GameController, options);

const userController = new UserController();
const gameController = new GameController();

await userController.createUser({
    firstName: "Lorem",
    lastName: "Ipsum",
    favoriteGame: {
        category: "casual",
    },
    email: "lorem.ipsum@example.com",
    password: "12345678",
});

console.log(await gameController.listGames());
```

## Scopes

Use `@scope` to define scopes in which particular fields of a class should be included.
Scopes can include each other. In the example below, the scope **foreign** only includes the
fields `username` and **owner** includes `password`, `email` and `username`.

```typescript
import { scope, createScope } from "hyrest";

const foreign = createScope();
const owner = createScope().include(foreign);
const signup = createScope();

class User {
    @scope(owner, signup)
    public password: string;

    @scope(owner, signup)
    public email: string;

    @scope(foreign, signup)
    public username: string;
}
```

### Dumping

The `dump` function will create a new object containing all keys which were marked with the specific
scope.

```typescript

const user: User = ...;

console.log(dump(owner, user));
// {
//     email: "test@example.com",
//     username: "test",
//     password: "12345678"
// }
console.log(dump(foreign, user));
// {
//      username: "test"
// }
```

### Nested objects

Often, objects will be nested and you will want to dump those nested objects. Scopes are valid
across nested objects as well:

```typescript
import { scope, createScope } from "hyrest";

const foreign = createScope();
const owner = createScope().include(foreign);

class User {
    @scope(owner)
    public password: string;

    @scope(owner)
    public email: string;

    @scope(foreign)
    public username: string;

    @scope(foreign)
    public games: Game[];
}

class Game {
    @scope(owner)
    public pricePayed: number;

    @scope(foreign)
    public name: string;

    @scope(foreign)
    public hoursPlayed: string;
}
```

So if you call `dump` on a user, only the correctly scoped properties will be included:

```typescript
const user: User = ...;

console.log(dump(owner, user));
// {
//    password: "12345678",
//    email: "test@example.com",
//    username: "test",
//    games: [
//        {
//            pricePayed: 42.5,
//            name: "Some game",
//            hoursPlayed: 100,
//        }
//    ]
//}
console.log(dump(foreign, user));
// {
//    username: "test",
//    games: [
//        {
//            name: "Some game",
//            hoursPlayed: 100,
//        }
//    ]
//}
```

You can call `dump` as described above or use the curried notation (`dump(scope)(instance)`).
This is especially usefull for the use in higher order functions like `map`:

```typescript
users.map(dump(owner))
```

### Populating

It is possible to populate a structure of classes with a given input using the defined scopes:

```typescript
import { scope, createScope } from "hyrest";

const signup = createScope();
const world = createScope();

class Pet {
    @scope(world)
    public id: string;

    @scope(signup)
    public name: string;

    public format() {
        return `Pet name is: ${this.name}`;
    }
}

class User {
    @scope(world)
    public id: string;

    @scope(signup, world)
    public name: string;

    @scope(signup, world)
    public email: string;

    @scope(signup, world)
    public password: string;

    @scope(signup, world)
    public pet: Pet;

    public format() {
        return `User name is: ${this.name}`;
    }

    public passwordLength() {
        return this.password.length;
    }
}
```

The structure above can be populated with any matching structure. Only the keys defined in the
specified scope will be taken into account. Actual instances of the defined classes will
be created.

```typescript
import { populate } from "hyrest";
const input = {
    name: "Lorem Ipsum",
    email: "test@example.com",
    password: "12345678",
    pet: {
        name: "pete"
    }
};

const user: User = populate(signup, User, input);
console.log(user.constructor); // Will be `User`
console.log(user.pet.constructor); // Will be `Pet`
console.log(user.format()); // "User name is: Lorem Ipsum"
console.log(user.pet.format()); // "Pet name is: Pete"
```

Of course, populate also has a curried version available for easy use in higher order functions:

```typescript
populate(signup, User)(input)
```

It is possible to transform properties before populating a field using `@transform(input => output)`.
This is for example usefull to encrypt a password or similar. This also applies to parameters.

#### Populating Arrays

Arrays can also be populated, but a special `specify` decorator is necessary to infer the type of
the array's elements:

```typescript
import { scope, specify } from "hyrest";

class User {
    @scope(signup) @specify(() => User)
    public friends: User[];

    @scope(signup) @specify(() => Pet)
    public pets: Pet[];

    @scope(signup) @specify(() => String)
    public favoriteColors: string[];
}
```

Otherwise an `InvariantError` will be thrown.

#### A word on validation

The `populate` function is not intended to be used for validation and does not feature a
validation layer of any kind. If a class expects property `a` to be a `string`, but a `number`
is provided, nothing will break. Take a look at [Validation](#validation).

## Contributing

Yarn is used instead of npm, so make sure it is installed, probably: `npm install -g yarn`.

Install all dependencies using

```
yarn install
```

### Building

In order to build the code:

```
yarn build
```

### Running the tests with coverage

```
yarn test
```

### Linting

```
yarn lint
```

### Starting the example

Server:

```
cd exmaple
yarn run:server
```

Client:

```
cd exmaple
yarn run:client
```

## Contributors

 - Frederick Gnodtke
