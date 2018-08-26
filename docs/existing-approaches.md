---
id: existing-approaches
title: Existing approaches
---

All the problems defined in [Drawbacks](drawbacks) are by no means new and Hyrest does not claim to be the first library to solve them all. Many great solutions already exist and solve some of the problems caused by a service-oriented approach. Check what problems apply to your project and perform research for possible solutions before picking one.

## Hand-picked examples

### Decide for one ecosystem

The problem of duplicated code, logic and interfaces can be solved by deciding for one language and ecosystem and sticking with it throughout your project whenever possible.

Please note, that the frontend does by no means have to dictate the backend's language, you don't have to rely on Node.JS just to re-use your validation logic from the backend in the frontend. Solutions for Python, Java, Rust, Ruby and many more languages exist and emscripten even makes it possible to compile your QT UI into the web.

Webassembly is also a great step forward for getting rid of Javascript in the frontend.

### Code generators

Projects like OpenAPI Spec make it possible to generate client-side libraries for dealing with the backend's Api more conventiently. Simple annotation in your backend's controllers make it possible to call Api methods like simple asynchroneous functions.

It is also often possible to generate interfaces for languages like Typescript based on the interfaces exposed from the backend.

Code generators like these make it easier stay consistent and type-safe, share documentation and get rid of response validation.

### Smarter alternatives to REST

You don't have to rely on JSON over REST nowadays.

Facebook has developed a modern alternative to REST called GraphQL which makes communication between services much more convenient byfeaturing its own query language. GraphQL has support for visual explorers of the Api and is basically self-documenting.

Using a modern alternative to REST can ease the pain of communicating between services and hence boost development speed.

### Api integration layer

In order to keep your Api consistent, secure and gain back control over what is exposed in which version you could hide all backends behind an Api integration layer. The Api integration layer will handle all calls and decide what comes through and is handled by what.

### Api versioning

By versioning your Api (for example by adding a `api.example.com/v5/` prefix to your URL) you can make sure migrations from breaking changes can happen in each team's own speed with eased pain.

This can be crucial when two teams have their own deadlines and one of the teams depends on the other teams Api. A breaking Api change could risk the consuming team's deadline and hence the other team is blocked.

### Containerization

The problem of deployment and operating can be eased (but certainly not solved) by using modern cluster solutions such as Kubernetes or simply hosting your services containerized at different cloud providers.

### Continuous Integration

Continuous Integration services are gaining in popularity. Using a CI solution to integration-test your sub-projects, perform your [code generation](#code-generators) for you and automate your deployment can help a lot.

### Api tests

Write abstract Api tests against your exposed Apis from the beginning. It will pay off in terms of maintainability and can often also serve as documentation and reference for developers consuming your Api.

### Server-side includes

It is possible to write parts of the application using a traditional stack, template-rendering most parts of (perhaps a content-intensive) frontend and using a modern stack only for parts which need more interactivity.

## Conclusion

Hyrest is not the first library trying to solve problems related to software architecture.

You are likely not the first team to encounter any problem.

Many great projects have been invented to solve a great number of problems.

It is always a great idea to identify problems in similar projects or predict them and search for existing solutions.

Don't re-invent the wheel and don't trust random guides you found in some library's documentation.

Don't use the first or most obvious solution you found. Good research often is the key to success.
