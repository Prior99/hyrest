---
id: companion-technologies
title: Companion Technologies
---

Some technologies have prooven to work well together with Hyrest and create certain syngertic effects when used alongside. Find some inspiration in this set of suggested companion technologies. For some of which connectors have been implemented.

## Typeorm

[Typeorm](http://typeorm.io/) is an [ORM](architectural-inspirations#use-an-orm) written entirely in Typescript. It defines models as classes using decorators and works exceptionally well together with Hyrest. When utilizing both libraries together, a model can be written once, then annotated and used basically everywhere throughout the application. As opposed to its bigger competitor [Sequelize](http://docs.sequelizejs.com/), Typeorm is modern, being actively developed, using Promises and can infer much from Typescript's typings.

Hyrest has been inspired by Typeorm and projects used to evaluate Hyrest and steer its development have been using Typeorm ever since.

## TSDI

[Dependency injection](architectural-inspirations#dependency-injection) can be used as the backbone and hidden wiring of your application. [Multiple solutions for dependency injection in JavaScript](https://www.npmjs.com/search?q=keywords:dependency%20injection) and [some even support Typescript](https://www.npmjs.com/search?q=keywords%3Adependency%20injection%20typescript). I found [TSDI](https://tsdi.js.org/) to be the best solution to work with Typescript due to its simple syntax, full decorator support and good documentation.

## Express

There is not really an alternative to [Express](https://expressjs.com/) when developing a Node.JS backend, and a [connector for hyrest](https://www.npmjs.com/hyrest-express) exist. Mounting your controllers as an express middleware is the recommended way of serving an Hyrest backend.

## MobX & React

A vast set of statemanagement and rendering libraries exist. [MobX](https://mobx.js.org/) plays very well together with [React](https://reactjs.org/) and Hyrest due to it's decorator-based approach. [React still has the by far greatest share across all modern frameworks competing with it](https://www.npmtrends.com/angular-vs-react-vs-vue) and is in my personal oppinion the best rendering framework out there.

MobX helps connecting your model's inferred data to your frontend using `@computed` and together with `@observable` and `@observer` (from [mobx-react](https://github.com/mobxjs/mobx-react)) can be everything in terms of statemanagement you need.

Some of Hyrest's concepts such as the decorator approach and the idea to provide a minimal set of utilities have been inspired by mobx.

A utility library connecting MobX with Hyrest for improved state-keeping within components and easier reusing of validation in the frontend is currently being developed.

## Clime

Your application has to start up somehow. Often you will have the requirement to provide a set of utilities along with your server, for mass-importing dumps, exporting backups, performing maintenance task, guided configuration, etc.

As a typesafe solution for generating a CLI, [clime](https://github.com/vilic/clime) seems to be a good choice. It is a bit lacking in terms of documentation, but it is decorator oriented and plays well together with Hyrest.

## Supertest

Integration testing of your generated Api is important. Testing your Api should happen as a blackbox test against the Api exposed by the backend in order to improve readability and consistency. At some point perhaps other 3rd-party applications might consume your REST Api and you should make sure that it doesn't break unexpectedly.

The way Hyrest works it can be quite unobvious that the REST Api changed.

To avoid completely booting your backend you can use [Supertest](https://github.com/visionmedia/supertest), a library for testing Express-based backends.
