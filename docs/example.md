---
id: example
title: Example
---

To understand Hyrest better, for learning by example or to evaluate it, example can proove helpfull.

## Realworld examples

Some opensource projects have been based on Hyrest:

- [Go3](https://github.com/Prior99/go3), a progressive web application for playing the boardgame "Go".
- [Mumble Bot](https://gitlab.com/prior99/mumble-bot), a bot for the voice-char software "Mumble".
- [Monday](https://gitlab.com/prior99/monday), a software for generating random words for games like "Charade".

## Fullstack Todo Example

Follow along this tutorial and write a Todo Example application on your to get your hands dirty with Hyrest.
The example will be published as a git repository on Github with commits for every step.

### 1. Basic setup

Initialize your project using [npm](https://docs.npmjs.com/cli/init) or [yarn](https://yarnpkg.com/en/docs/cli/init):

```sh
yarn init .
```

Add the following dependencies:

- `body-parser`: Express needs it to parse JSON.
- `express`: For serving the backend.
- `hyrest-express`: For connecting Hyrest to Express.
- `hyrest`
- `mobx-react`: For connecting MobX to React.
- `mobx`: As statemanagement in the frontend.
- `pg`: Postgres backend for Typeorm.
- `react-dom`: React backend for the browser's DOM.
- `react`: As rendering framework.
- `tsdi`: Dependency injection.
- `typeorm`: The suggested ORM.

And the following development dependencies:

 - `@types/body-parser`
 - `@types/express`
 - `@types/node`
 - `@types/react`
 - `ts-loader`: Loading typescript from webpack.
 - `ts-node`: For quickly starting the backend. Don't use this in production.
 - `typescript`: For compiling Typescript to Javascript.
 - `webpack-cli`
 - `webpack-dev-server`:
 - `webpack`: For compiling the frontend into a bundle.

```sh
yarn add body-parser express hyrest-express hyrest mobx-react mobx pg react-dom react tsdi typeorm && yarn add @types/body-parser @types/express @types/node @types/react ts-loader ts-node typescript webpack-cli webpack-dev-server webpack 
```

Initialize a git repository and push it to the remote location:

```sh
git init .
echo "node_modules/" >> .gitignore
git add package.json yarn.lock .gitignore
git commit -m "Initial commit"
git remote add origin git@github.com:Prior99/hyrest-todo-example.git
git push -u origin master
```

### 2. Create models

I suggest to get inspiration by drawing some UI sketches but designing your application from bottom to top. Hence in this tutorial we will start with the database models.

```sh
mkdir -p src/common/models
```

We will need entries for our Todo-List application so we have to define a model for it.
Think about what properties your model will have first.

Our Todo entries will need a unique id, a name, a description. They will have been created at some point, can be checked and deleted.

Fire up your IDE and implement the class for the Todo model in `src/common/models/todo.ts`:

```typescript
export class Todo {
    public id?: string;
    public name?: string;
    public description?: string;
    public created?: Date;
    public checked?: Date;
    public deleted?: Date;
}
```

Following the [Typeorm guide](http://typeorm.io/), annotate the class with decorators:

```typescript
import { Column, PrimaryGeneratedColumn, Entity, CreateDateColumn, UpdateDateColumn } from "typeorm";

export class Todo {
    @PrimaryGeneratedColumn("uuid")
    public id?: string;

    @Column("varchar", { length: 128 })
    public name?: string;

    @Column("text")
    public description?: string;

    @CreateDateColumn()
    public created?: Date;

    @Column("timestamp without time zone", { nullable: true })
    public checked?: Date;

    @Column("timestamp without time zone", { nullable: true })
    public deleted?: Date;
}
```

We will be using the model for both the database as the controllers, so let's add some Hyrest decorators providing us with validation.

```typescript
import { Column, PrimaryGeneratedColumn, Entity, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { is, specify, length, uuid } from "hyrest";

export class Todo {
    @PrimaryGeneratedColumn("uuid")
    @is().validate(uuid)
    public id?: string;

    @Column("varchar", { length: 128 })
    @is().validate(length(0, 128))
    public name?: string;

    @Column("text")
    @is()
    public description?: string;

    @CreateDateColumn()
    @is() @specify(() => Date)
    public created?: Date;

    @Column("timestamp without time zone", { nullable: true })
    @is() @specify(() => Date)
    public checked?: Date;

    @Column("timestamp without time zone", { nullable: true })
    @is() @specify(() => Date)
    public deleted?: Date;
}
```

We need to use `@specify(() => Date)` for the three properies having `Date` as type. Is is a special case only needed for `Date` and when two classes import each other in a circular way.

The `DataType` can be omitted from every `@is()` as Hyrest can infer them automatically from Typescript's reflection metadata Api.
