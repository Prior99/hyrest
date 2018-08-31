---
id: api-validation
title: Validation
---

Of course, it is important to validate all input.
The library itself is typesafe but the REST endpoint might be called by 3rd parties.
Apart from that consistency checks are also necessary in a typesafe environment.

Hyrest provides a set of [free functions with a simple interface](#custom-validators), [low-level schema validation](#manually) and a [decorator](#inferred-from-model) for inferring the schema from a model.
These schemas can then be used to validate incoming data [in the backend](api-routes-controllers#route-configuration) as well as for validation of [forms in the frontend](api-forms).

## Parameters

Parameters can be validated and converted using the [@is](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#is) decorator like this:

```typescript
import { query, controller, ok, is, DataType } from "hyrest";

@controller()
class GameController {
    @route("GET", "/games")
    public async listGames(@query("count") @is(DataType.int) count: number) {
        return ok([
            ...
        ]);
    }
}
```

When using an [@is](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#is) decorator with a data type, the input is validated and automatically converted, so in the example above `count` is of type number.

## Advanced validation

In addition to validating the data type and converting the input, advanced validation can be performed:

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

## Schema validation

### Manually

It is possible to perform schema validation of object using the same infrastructure as for parameters:

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
class UserController {
    @route("POST", "/user")
    public async createUser(@body() @is(DataType.obj).schema(UserSchema) user: User) {
        ...
        return created(user)
    }
}
```

### Inferred from model

Schemas can be generated from classes.
The data types can be inferred from the typescript type.
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

Still, all properties included in the schema have to be included by decorating them with [@is](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#is).
The schema can then be used by using `schemaFrom()`:

```typescript
@route("POST", "/user")
public async createUser(@body() @is(DataType.obj).schema(schemaFrom(User)) user: User) {
    ...
```

> The whole `@is(DataType.obj).schema(schemaFrom(User))` part can be left out, as Hyrest will automatically detect that the parameter's type `User` has a schema defined and perform a schema validation.

This also works for arrays, however it is not possible to infer the array type from the property,
so [@specify](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#specify) has to be used:

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
public async createUser(@body() @is(DataType.obj).schema(schemaFrom(User)).scope(signup) user: User) {
    ...
```

> As mentioned above, the whole `@is(DataType.obj).schema(schemaFrom(User))` part can be left out.
> When leaving it out, provide the scope as the first argument to the [@body](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#body) decorator.

It is also possible to limit individual validators to certain scopes using [only](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#only). Just wrap the validator in [only](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#only), specifying a scope:

```typescript
only(signup, email)
```

## Failing validation

When the validation fails a "422 UNPROCESSABLE ENTITY" is returned, containing a body with `{ message: "Error message." }`.
Only the first error message will be returned.

## Custom data types

A new data type can be introduced by implementing a function following this interface:

```typescript
interface Converted<T> {
    error?: string;
    value?: T;
}

type Converter<T> = (input: any) => Converted<T> | Promise<Converted<T>>;
```

The function should return an object with `{ value: convertedValue }` when the conversion
succeeded and `{ error: "Oh, no." }` when the input failed to be converted.

The `float` data type looks like this for example:

```typescript
export function float(input: any): Converted<number> {
    if (typeof input === "undefined") { return { value: input }; }
    const value = parseFloat(input);
    if (isNaN(value)) { return { error: "Not a valid float." }; }
    return { value } ;
}
```

## Custom validators

It is just as easy to add custom validators, as it is to add new data types.
The interface looks like this:

```typescript
interface Validation {
    error?: string;
}

type Validator<T> = (input: T) => Validation | Promise<Validation>;

```

It's very similar to introducing new data types.
In case of success an empty object (`{}`)  is returned, when an error occurred, an error message should be provided.

```typescript
function required<T>(value: T): Validation {
    if (typeof value === "undefined" || value === null) { return { error: "Missing required field." }; }
    return {};
}
```

## Context sensitive validation

A method called [validateCtx](https://prior99.gitlab.io/hyrest/api/hyrest/interfaces/fullvalidator.html#validatectx) exists on [@is](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#is), which takes a factory with the context passed in as the first argument.

> It is possible to specify the context by calling [context on the hyrest middleware](api-server#context).
> This way a context object can be passed through to the validation.

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
    public async validateEmail(@body() @is(DataType.str).validateCtx(ctx => ctx.validator) value: string) {
        ...
    }
}
```

### Database example

Using the database for validating a property is not a problem.
All validators can be asynchronous or return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
This way, a validator might just as well perform a request against the database.

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

### In the frontend

The frontend can also perform validation against the database, if the method used for checking is a route on a controller:

```typescript
import { controller, route, body } from "hyrest";

@controller()
class ValidationController {
    @route("POST", "/validate/email")
    public async validateEmail(@body() value: string) {
        if (typeof value === "undefined") { return {}; }
        const rows = await db.query("SELECT id FROM user WHERE email = ?", [ value ]);
        return rows.length === 0 ? {} : { error: "Email already taken." };
    }
}
```

Afterwards just use the method as a validator in any schema or decorator.
The frontend will call the REST endpoint and the server will perform the check on the database.
