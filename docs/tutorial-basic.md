---
id: tutorial-basic
title: 1. Basic Setup
---

Some basic setup is needed for every Hyrest application. In this Step the necessary dependencies and a basic JS project with a git repository will be set up.

## Initialize a JS project

Initialize your project using [npm](https://docs.npmjs.com/cli/init) or [yarn](https://yarnpkg.com/en/docs/cli/init):

```sh
yarn init .
```

## Add dependencies

Add the following dependencies:

- `body-parser`: Express needs it to parse JSON.
- `express`: For serving the backend.
- `hyrest-express`: For connecting Hyrest to Express.
- `hyrest`
- `hyrest-mobx`: For connecting Hyrest to MobX.
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
 - `ts-loader`: Loading typescript from Webpack.
 - `ts-node`: For quickly starting the backend. Don't use this in production.
 - `typescript`: For compiling Typescript to JavaScript.
 - `webpack-cli`
 - `webpack-dev-server`:
 - `webpack`: For compiling the frontend into a bundle.

```sh
yarn add body-parser express hyrest-express hyrest mobx-react mobx pg react-dom react tsdi typeorm && yarn add @types/body-parser @types/express @types/node @types/react ts-loader ts-node typescript webpack-cli webpack-dev-server webpack 
```

## Initialize git

Initialize a git repository and push it to the remote location:

```sh
git init .
echo "node_modules/" >> .gitignore
git add package.json yarn.lock .gitignore
git commit -m "Initial commit"
git remote add origin git@github.com:Prior99/hyrest-todo-example.git
git push -u origin master
```
