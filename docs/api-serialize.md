---
id: api-serialize
title: Serializing and deserializing
---

Hyrest will use [JSON](https://www.json.org/) data-interchange format.
In addition to simply serializing and deserializing, features for sanitizing and cleaning data are provided:

- [Scopes](#scopes) provide an easy way to control which properties on a model's schema are allowed.
- [Precomputed values](#precomputed-values) can be useful to hide information from the frontend or reduce the amount of transmitted data.
- [Dumping](#dumping) can happen by [configuring the route](http://localhost:3000/hyrest/docs/api-routes-controllers#route-configuration) to dump the data before sending it and populate it on the other side, or manually.
- [Populating](#populating) can happen by [configuring the route](http://localhost:3000/hyrest/docs/api-routes-controllers#route-configuration) to populate the data after receiving it, or manually.

## Scopes

Use [@scope](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#scope) to define scopes in which particular fields of a class should be included.

Four scopes have been defined on the model below:

- **World**: Public access should only be granted to **id** and **name**.
- **Signup**: When signing up, the user needs to input **email**, **name**, and **password**.
- **Login**: The user will login with **email** and **password**.
- **Owner**: The user can load his own user, but the password is never transmitted, hence this scope contains **email**, **id** and **name**.

```typescript
import { scope, createScope } from "hyrest";

const world = createScope();
const owner = createScope().include(world);
const login = createScope();
const signup = createScope();

class User {
    @scope(world)
    public id: string;

    @scope(login, signup)
    public password: string;

    @scope(login, signup, owner)
    public email: string;

    @scope(world, signup)
    public name: string;
}
```

![Scopes](assets/scopes.svg)

## Precomputed values

Sometimes it can be necessary to compute values on the server and have them available on the client.
This can be achieved using [@precompute](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#precompute):

```typescript
import { scope, createScope, precompute } from "hyrest";

const owner = createScope();
const world = createScope();

class User {
    @scope(owner)
    public email: string;

    @scope(world) @precompute
    public get avatarUrl() {
        // This code will be executed on the server and the value will be transmitted to the client.
        // The client will never execute this code and does not need access to `this.email`, so
        // `this.email` can be kept private.
        return `https://example.com/avatar/${sha256(this.email)}.png`;
    }
}

console.log(dump(world, user));
// {
//     avatarUrl: "https://example.com/avatar/3426c53bde535550ace9f38078123d630fd1373ec0e507ae9a3aa3b16139ebf2.png"
// }
```

Of course, on the client the populated instance of the class can normally access the getter, it will
return the value received from the server and not execute the code of the getter.

## Dumping

The [dump](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#dump) function will create a new object containing all keys which were marked with the specific [scope](#scopes).

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

## Nested objects

Often, objects will be nested and you will want to dump those nested objects.
Scopes are valid across nested objects as well:

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

You can call [dump](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#dump) as described above or use the curried notation (`dump(scope)(instance)`).
This is especially useful for the use in higher order functions like [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map):

```typescript
users.map(dump(owner))
```

## Populating

It is possible to populate a structure of classes with a given input using the defined [scopes](#scopes):

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

The structure above can be populated with any matching structure. Only the keys defined in the specified scope will be taken into account.
Actual instances of the defined classes will be created.

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

Of course, [populate](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#populate) also has a curried version available for easy use in higher order functions:

```typescript
populate(signup, User)(input)
```

It is possible to [transform](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#transform) properties before populating a field using `@transform(input => output)`.
This is for example useful to encrypt a password.
This decorator can also be applied to parameters.

Dates can be populate from strings automatically (as dates are not preserved but turned into strings when serializing to [JSON](https://www.json.org/)), but the [@specify](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#specify) decorator (`@specify(() => Date)`) must be added as currently typescript can not preserve the type to be date on its own.

### Populating Arrays

Arrays can also be populated, but the [@specify](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#specify) decorator is necessary to infer the type of the array's elements:

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

### A word on validation

The [populate](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#populate) function is not intended to be used for validation and does not feature a validation layer of any kind.
If a class expects property `a` to be a `string`, but a `number` is provided, nothing will break.
Take a look at [validation](api-validation.md) if you need this.

