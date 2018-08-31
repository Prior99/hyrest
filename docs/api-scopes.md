---
id: api-scopes
title: Scopes
---

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

## Precomputing values

Sometimes it can be neccessary to compute values on the server and have them available on the client.
This can be achieved using `@precompute`:

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

Of course on the client the populated instance of the class can normally access the getter, it will
return the value received from the server and not execute the code of the getter.

## Dumping

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

## Nested objects

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

## Populating

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

Dates can be populate from strings automatically (as dates are not preserved but turned into strings
when parsing JSON), but the `@specify(() => Date)` decorator must be added as currently typescript can not
preserve the type to be date on its own.

### Populating Arrays

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

### A word on validation

The `populate` function is not intended to be used for validation and does not feature a
validation layer of any kind. If a class expects property `a` to be a `string`, but a `number`
is provided, nothing will break. Take a look at [Validation](#validation).

