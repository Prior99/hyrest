---
id: introduction-companion-technologies
title: Companion Technologies
---

Some technologies have proven to work well together with Hyrest and can have synergetic effects when used alongside.
Find some inspiration in this set of suggested companion technologies.

## Typeorm

[Typeorm](http://typeorm.io/) is an [ORM](introduction-architectural-inspirations.md#use-an-orm) written entirely in [Typescript](https://www.typescriptlang.org/).
It defines models as classes using decorators and works exceptionally well together with Hyrest.
When utilizing both libraries together, a model can be written once, then annotated and used basically everywhere throughout the application.
As opposed to its bigger competitor [Sequelize](http://docs.sequelizejs.com/), [Typeorm](http://typeorm.io/) is modern, being actively developed, uses [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and can infer much from [Typescript](https://www.typescriptlang.org/)'s typings.

> Hyrest has been inspired by [Typeorm](http://typeorm.io/) and projects used to evaluate Hyrest and steer its development have been using [Typeorm](http://typeorm.io/) ever since.

## TSDI

[Dependency injection](introduction-architectural-inspirations.md#dependency-injection) can be used as the backbone and hidden wiring of your application.
[Multiple solutions for dependency injection in JavaScript](https://www.npmjs.com/search?q=keywords:dependency%20injection) and [some even support Typescript](https://www.npmjs.com/search?q=keywords%3Adependency%20injection%20typescript).
I found [TSDI](https://tsdi.js.org/) to be the best solution to work with [Typescript](https://www.typescriptlang.org/) due to its simple syntax, full decorator support and good documentation.

## Express

There is not really an alternative to [Express](https://expressjs.com/) when developing a [Node](https://nodejs.org/) backend, and a [connector for hyrest](https://www.npmjs.com/hyrest-express) exists.
Mounting your controllers as an express middleware is the recommended way of serving an Hyrest backend.

## MobX & React

A large number of [state-management](https://www.npmjs.com/search?q=keywords:state) and [rendering](https://en.wikipedia.org/wiki/List_of_JavaScript_libraries#Web-application_related_(MVC,_MVVM)) libraries exist.
[MobX](https://mobx.js.org/) plays very well together with [React](https://reactjs.org/) as well as Hyrest due to it's decorator-based approach.

> React still has the by far [greatest share](https://www.npmtrends.com/angular-vs-react-vs-vue) across all modern frameworks competing with it and is in my personal opinion the best rendering framework out there.

[MobX](https://mobx.js.org/) helps you to connect your model's inferred data to your frontend using [@computed](https://mobx.js.org/refguide/computed-decorator.html) and together with [@observable](https://mobx.js.org/refguide/observable-decorator.html) and [@observer](https://mobx.js.org/refguide/observer-component.html) (from [mobx-react](https://github.com/mobxjs/mobx-react)) can be everything in terms of state-management you need.

> Some of Hyrest's concepts such as the decorator approach and the idea to provide a minimal set of utilities have been inspired by mobx.

A utility library connecting [MobX](https://mobx.js.org/) with Hyrest for improved state-keeping within components and easier reusing of validation in the frontend is currently being developed.

## Clime

Your backend application has to start up somehow.
Often you will have the requirement to provide a set of utilities along with your server, for mass-importing dumps, exporting backups, performing maintenance task, guided configuration, etc.
As a typesafe solution for generating a [CLI](https://en.wikipedia.org/wiki/Command-line_interface), [clime](https://github.com/vilic/clime) seems to be a good choice.
It is a bit lacking in terms of documentation, but it is decorator oriented and plays well together with Hyrest.

## Supertest

[Integration testing of your generated API is important.](https://blog.udemy.com/api-testing/)
Testing your API should happen as a blackbox test against the API exposed by the backend in order to improve readability and consistency.
At some point perhaps other 3rd-party applications might consume your REST API and you should make sure that it doesn't break unexpectedly.

The way Hyrest works it can be quite unobvious that the REST API changed.

To avoid completely booting your backend you can use [Supertest](https://github.com/visionmedia/supertest), a library for testing [Express](https://expressjs.com/)-based backends.

