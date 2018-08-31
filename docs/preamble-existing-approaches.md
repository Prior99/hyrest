---
id: preamble-existing-approaches
title: Existing approaches
---

All the [problems of single-page applications](preamble-problems-with-spas) are by no means new and Hyrest does not claim to be the first library to attempt to solve them.
Many great solutions already exist and solve some of the problems caused by an single-page approach.
Check what problems apply to your project and perform research for possible solutions before picking one.

## Hand-picked examples

Please take a look at the following advices for solving many of the problems Hyrest aims to solve - without deciding for Hyrest.

In addition, take a look at existing solutions for JavaScript (like [Sails](https://sailsjs.com/), [Meteor](https://www.meteor.com/) or [Ionic](https://ionicframework.com/)) which basically solve the same problem in different ways.

### Simply Decide for one ecosystem

The problem of duplicated code, logic and interfaces can be solved by deciding for one language and ecosystem and sticking with it throughout your project whenever possible.

It might already be enough to simply decide for one ecosystem and stick with traditional solutions.

Please note, that the frontend does by no means have to dictate the backend's language, you don't have to rely on [Node](https://nodejs.org/) just to re-use your validation logic from the backend in the frontend.
Solutions for [Python](https://www.transcrypt.org/), [Java](http://www.gwtproject.org/), [Rust](https://github.com/DenisKolodin/yew), [Ruby](https://opalrb.com/) and many more languages exist.

[Emscripten](https://github.com/kripken/emscripten) even makes it possible to compile your [QT UI into the web](https://wiki.qt.io/Qt_for_WebAssembly).
[Webassembly](https://webassembly.org/) is a great step forward for getting rid of Javascript in the frontend.

### Code generators

Projects like [OpenAPI](https://www.openapis.org/) and [Swagger](https://swagger.io/) make it possible to generate client-side libraries for dealing with the backend's API more conventiently.
Simple annotation in your [backend's controllers](https://pypi.org/project/flask-apispec/) make it possible to call API methods like simple asynchroneous functions.

[It is also often possible to generate interfaces for languages like [Typescript](https://www.typescriptlang.org/) based on the interfaces exposed from the backend.](https://swagger.io/tools/swagger-codegen/)

Code generators like these make it easier stay consistent and type-safe, share documentation and get rid of response validation.

### Smarter alternatives to REST

You don't have to rely on JSON over REST nowadays.

Facebook has developed a modern alternative to REST called [GraphQL](https://graphql.org/) which makes communication between services much more convenient by featuring its own query language.
[GraphQL](https://graphql.org/) has support for [visual explorers](https://github.com/graphql/graphiql) of the API and is basically self-documenting.

Using a modern alternative to REST can ease the pain of communicating between services and hence boost development speed.

### Server-side includes

It is possible to write parts of the application using a traditional stack, template-rendering most parts of (perhaps a content-intensive) frontend [and using a modern stack only for parts which need more interactivity](https://en.wikipedia.org/wiki/Server_Side_Includes).

## Conclusion

Hyrest is not the first library trying to solve problems related to modern web development.

It is always a great idea to identify problems and search for existing solutions.

> Good research often is the key to success.
