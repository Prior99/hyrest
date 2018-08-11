# Hyrest Mobx

[![npm](https://img.shields.io/npm/v/hyrest.svg)](https://www.npmjs.com/package/hyrest)
[![Build Status](https://travis-ci.org/Prior99/hyrest.svg?branch=master)](https://travis-ci.org/Prior99/hyrest)
[![Coverage Status](https://coveralls.io/repos/github/Prior99/hyrest/badge.svg?branch=master)](https://coveralls.io/github/Prior99/hyrest?branch=master)

Hyrest is a hybrid REST framework for both the client and the server.

This is the mobx frontend utility package.

After creating and exposing a REST Api using [hyrest](../hyrest) and [hyrest-express](../hyrest-express) it might be usefull to re-use
the existing models and validation from the server side in the client to store data next to forms and perform validation on it.

Documentation can not be provided until [typedoc#733](https://github.com/TypeStrong/typedoc/issues/733) is resolved.

## Table of contents

 * [Hyrest-MobX](#hyrest-mobx)
     * [Table of contents](#table-of-contents)
     * [Arrays](#arrays)
         * [Inside a nested class](#inside-a-nested-class)
         * [Directly on the injected property](#directly-on-the-injected-property)
     * [Validation](#validation)
         * [Validation status](#validation-status)
         * [Errors](#errors)

## Usage

Let's say a model has been defined which is already used by a controller:

```typescript
import { is, email, length } from "hyrest";
class User {
    @is().validate(email) public email: string;
    @is().validate(length(5, 20)) public name: string;
    @is().validate(length({ min: 10 })) public password: string;
}
```

In order to create a new user, one might want to implement a signup form. This is where this package can come in handy.

Instead of creating a `@observable public email: string` and so on for each field on the `User` model, simple utilize hyrest-mobx:

```typescript
import * as React from "react";
import { observer } from "mobx-react";
import { field, hasFields, Field } from "hyrest-mobx";

@observer @hasFields()
class Signup extends React.Component {
    @field(User) private user: Field<User>;

    @action.bound private handleSubmit() {
        console.log(user.value); // Will log the unwrapped user.
    }

    public render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <input type="text" {...this.user.nested.email.reactInput} />
                <input type="text" {...this.user.nested.name.reactInput} />
                <input type="password" {...this.user.nested.password.reactInput} />
                {
                    this.users.errors.map((err, index) => <p key={index}>{err}</p>)
                }
                <button disabled={!this.user.valid}>Signup</button>
            </form>
        );
    }
}
```

The decorator `@field` will mark the property as a field with the type `User`.

After marking the class with `@hasFields`, new `Field`s will automatically be injected upon creation.

The injected values already utilize Mobx under the hood and hence no `@observable`s are no longer necessary.

## Arrays

Hyrest Mobx supports arrays. Arrays are wrapped in a special array wrapper instead of the default wrapper.
This wrapper behaves much like a readonly version of the default JS array, with added methods for usability.

Wrapped fields are accessed using `.at(index)` instead of the `[index]` operator.

### Inside a nested class

Arrays inside of hyrest managed classes are supported:

```typescript
import { is, email, length, specify } from "hyrest";
class User {
    @is().validate(email) public email: string;
    @is().validate(length(5, 20)) public name: string;
    @is().validate(length({ min: 10 })) public password: string;
}

class UserList {
    @is() @specify public users: User[];
}
```

### Directly on the injected property


Arrays can be injected into the receiving class directly:

```typescript
import * as React from "react";
import { specify } from "hyrest";
import { observer } from "mobx-react";
import { field, hasFields, Field } from "hyrest-mobx";

@observer @hasFields()
class Signup extends React.Component {
    @field(Array) @specify(User) private users: Field<User[]>;
    @field(User) private user: Field<User>;

    @action.bound private handleUserAdd() {
        this.users.add(this.user.value);
        this.user.reset();
    }

    public render() {
        return (
            <>
                <ul>
                    {
                        this.users.map((userField, index) => (
                            <p key={index}>{userField.value.name} ({userField.value.email})</p>
                        ))
                    }
                </ul>
                <form onSubmit={this.handleUserAdd}>
                    <input type="text" {...this.user.nested.email.reactInput} />
                    <input type="text" {...this.user.nested.name.reactInput} />
                    <input type="password" {...this.user.nested.password.reactInput} />
                    {
                        this.users.errors.map((err, index) => <p key={index}>{err}</p>)
                    }
                    <button disabled={!this.user.valid}>Signup</button>
                </form>
            </>
        );
    }
}
```

## Validation

All validation as defined in using the `@is` decorators on the model is used in the injeted field.

The includes [context validation](#context-validation).

The validation will be automatically performed when updating a field.

### Validation status

The status cann be retrieved using `Field.status` on any field. If the field is not a primitive one,
but wrapping other fields (such as the directly injected one), then the status of all sub fields will be merged into one:

```typescript
class Something {
    @is().validate(email) public email: string;
    @is().validate(length(8, 10)) public name: string;
}

class Wrapper {
    @is().validate(required) public something: Something;
}

@hasFields()
class Container {
    @field(Wrapper) wrapper: Field<Wrapper>;
}

const container = new Container();

console.log(wrapper.status); // Will log `"unknown"` (`ValidationStatus.UNKNOWN`).

await container.wrapper.update({
    something: {
        email: "invalid",
        name: "short"
    }
});

console.log(wrapper.status); // Will log `"invalid"` (`ValidationStatus.INVALID`).

await container.wrapper.nested.something.nested.email.update("someone@example.com");
await container.wrapper.nested.something.nested.name.update("longenough");

console.log(wrapper.status); // Will log `"valid"` (`ValidationStatus.VALID`).
```

Initially, before assigning any values, the validation status of all fields will be `"unknown"` (`ValidationStatus.UNKNOWN`).

The operation of `.update`ing a field is an asynchroneous operation (as validators could be asynchroneous).

While the validation is running, the status is `"in progress"` (`ValidationStatus.IN_PROGRESS`).

Shorthands for checking for a specific status exist: `Field.valid`, `Field.invalid`, `Field.unknown` and `Field.inProgress`.

### Errors

Error messages returned by the used validators can be accessed as an array or the first error can be retrieved:

```typescript
console.log(wrapper.errors); // An array of all error messages,
console.log(wrapper.error); // The first error message (Same as `wrapper.errors[0]`).
```

When calling `Field.errors` or `Field.error` on a structure with nested fields, a combined
array of all sub-field's errors will be returned.
