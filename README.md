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
     * [Validation](#validation)
         * [Parameters](#parameters)
         * [Advanced Validation](#advanced-validation)
         * [Schema Validation](#schema-validation)
         * [What happens when Validation Fails?](#what-happens-when-validation-fails)
         * [Custom Validators](#custom-validators)
         * [How about validation against my database?](#how-about-validation-against-my-database)
         * [How about validation against my database from the frontend?](#how-about-validation-against-my-database-from-the-frontend)
         * [What if I need to access "this" from my validator?](#what-if-i-need-to-access-this-from-my-validator)
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
so `@arrayOf` has to be used:

```typescript
class User {
    ...

    @is() @arrayOf(Game)
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

### What if I need to access "this" from my validator?

Another method called `validateCtx` exists, which takes a factory with the current `this` context
passed in as the first argument.

```typescript
import { controller, route, body, DataType } from "hyrest";

@controller()
class SomeController {
    private validator(value: string) {
        console.log(this); // Current instance on which the route was called.
        ...
    }
    @route("POST", "/validate/email")
    public validateEmail(@body() @is(DataType.str).validateCtx(ctx => [ctx.validator]) value: string) {
        ...
    }
}
```

## Usage as express middleware

Use the `hyrest` middleware to connect your controllers to express:

```typescript
import { hyrest } from "hyrest/dist/middleware";
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
**The middleware needs to be directly imported from `dist/middleware` in order to keep the overall bundle
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

#### Populating Arrays

Arrays can also be populated, but a special `arrayOf` decorator is necessary to infer the type of
the array's elements:

```typescript
import { scope, arrayOf } from "hyrest";

class User {
    @scope(signup) @arrayOf(User)
    public friends: User[];

    @scope(signup) @arrayOf(Pet)
    public pets: Pet[];

    @scope(signup) @arrayOf(String)
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
