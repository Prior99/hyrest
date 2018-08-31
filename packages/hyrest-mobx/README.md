# Hyrest MobX

<img align="right" width="200" height="200" src="https://github.com/Prior99/hyrest/raw/master/logo/hyrest-logo-400px.png">

[![npm](https://img.shields.io/npm/v/hyrest-mobx.svg)](https://www.npmjs.com/package/hyrest-mobx)
[![pipeline status](https://gitlab.com/prior99/hyrest/badges/master/pipeline.svg)](https://github.com/Prior99/hyrest)
[![coverage report](https://gitlab.com/prior99/hyrest/badges/master/coverage.svg)](https://github.com/Prior99/hyrest)

Hyrest is a hybrid REST framework for both the client and the server.

**This is the MobX frontend utility package.**

After creating and exposing a REST Api using [hyrest](../hyrest) and [hyrest-express](../hyrest-express) it might be useful to re-use the existing models and validation from the server side in the client to store data next to forms and perform validation on it.

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

In order to create a new user, one might want to implement a sign up form. This is where this package can come in handy.

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

## Resources

- [Tutorial](https://prior99.gitlab.io/hyrest/docs/tutorial-about)
- [Minimal example project](https://github.com/Prior99/hyrest-todo-example)
- [Documentation](https://prior99.gitlab.io/hyrest/)
- [Guide](https://prior99.gitlab.io/hyrest/docs/preamble-about/)
- [API Reference](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/)
