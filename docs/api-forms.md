---
id: api-forms
title: Forms
---

Often you will want to write a simple form for filling in details about a predefined model.
The package [hyrest-mobx](https://www.npmjs.com/hyrest-mobx) has your back.

## Fields

Let's say a model has been defined which is already used by a controller:

```typescript
import { is, email, length } from "hyrest";
class User {
    @is().validate(email) public email: string;
    @is().validate(length(5, 20)) public name: string;
    @is().validate(length({ min: 10 })) public password: string;
}
```

In order to create a new user, one might want to implement a sign up form. This is where this package can come in handy.

Instead of creating a `@observable public email: string` and so on for each field on the `User` model, simple utilize hyrest-mobx:

```tsx
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

The decorator [@field](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/globals.html#field) will mark the property as a field with the type `User`.

After marking the class with [@hasFields](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/globals.html#hasfields), new [Fields](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/interfaces/basefield.html) will automatically be injected upon creation.

The injected values already utilize Mobx under the hood and hence no [@observable](https://mobx.js.org/refguide/observable-decorator.html)s are no longer necessary.

## Arrays

Arrays are wrapped in a special array wrapper instead of the default wrapper.
This wrapper behaves much like a read only version of the default JS array, with added methods for usability.

Wrapped fields are accessed using [at](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/classes/fieldarray.html#at) instead of the `[index]` operator.

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

```tsx
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

All validation as defined in using the [decorators on the model](https://prior99.gitlab.io/hyrest/api/hyrest/globals.html#is) is used in the injected field.
This includes [context validation](#context-validation).
The validation will be automatically performed when updating a field.

### Validation status

The status can be retrieved using [Field.status](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/interfaces/basefield.html#status) on any field. If the field is not a primitive one,
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

Initially, before assigning any values, the validation status of all fields will be `"unknown"` ([ValidationStatus.UNKNOWN](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/enums/validationstatus.html#unknown)).

Calling [update](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/interfaces/basefield.html#update) on a field is an asynchronous operation (as validators could be asynchronous).

While the validation is running, the status is `"in progress"` ([ValidationStatus.IN_PROGRESS](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/enums/validationstatus.html#in_progress)).

Shorthands for checking for a specific status exist: `Field.valid`, `Field.invalid`, `Field.unknown` and `Field.inProgress`.

### Errors

Error messages returned by the used validators can be accessed as an array or the first error can be retrieved:

```typescript
console.log(wrapper.errors); // An array of all error messages,
console.log(wrapper.error); // The first error message (Same as `wrapper.errors[0]`).
```

When calling [Field.errors](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/interfaces/basefield.html#errors) or on a structure with nested fields, a combined array of all sub-field's errors will be returned.
The same also applies to [Field.error](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/interfaces/basefield.html#error).
