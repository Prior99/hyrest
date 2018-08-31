---
id: preamble-problems-with-spas
title: Problems with SPAs
---

Hyrest such as most modern stacks targets single-page applications.
Single-page applications provide your project with a clean cut between the backend and the frontend and allow a disconnected stack for your each of them.
But implementing your project as a single-page application does not only come with benefits and is certainly not be the best approach for every project.

## Drawbacks of a complex stack

Why is it generally not a good idea to implement everything using the most complex and scalable stack available?
When recalling the [Documents-to-Applications Continuum](document-application), why not just take the stack right-most side in the continuum?
This way the project's stack could scale beyond the sales team's wildest dreams and the architecture will surely withstand all future needs and technological progressions...

![Documents‐to‐Applications Continuum Speed](assets/documents-to-applications-continuum-speed.svg)

With an increase of scalability (and complexity), the development speed, cost of developers, required skills and management overhead will always increase too.

The reason for this are problems like

- Splitting an application into multiple sub applications will lead to code duplication and [implementational overhead](#implementational-overhead).
- [Using different technologies](#using-different-technologies) across the project's landscape will require developers able to understand the basics of some (if not all) of these technologies.
- Maintaining [dependencies between sub-projects](#dependencies-between-sub-projects) or to third-party projects can be cumbersome.
- [Deployment and operating](#deployment-and-operating) of more complex systems will become more cost-intensive and problem-prune.
- The bigger the project's landscape, the more possible [security](#security) vulnerabilities have to be taken into account.
- ...

### Implementational overhead

Why are template rendered applications initially so much faster to develop [compared to single-page applications](https://adamsilver.io/articles/the-disadvantages-of-single-page-applications/)?

Because everything lives in one integrated project.
The frontend is template-rendered from an application in the same repository, with the same language and a call to the database is simply a call to a function.

When writing a separate frontend application or even a set of multiple applications, there will be a gap somewhere between the user interface and the data from which it is rendered.

In a template rendered solution, only few steps are necessary to display a page.
Let's say a user in a social-network application requested another user's profile page (`app.example.com/user/other`).

In a template rendered solution, the necessary steps to display the profile page would roughly be something like this:

1. Perform routing (`app.example.com/user/:username`) and parse the user name from the URL.
2. Grab the data about user "other" from the database
3. Perform business logic and derive the data needed for the template to be rendered.
4. Fill out the template `<div><h1>User {{$username}}</h1> ...` and send the result back to the browser.

![Simple](assets/rendering-simple.svg)

While with a single-page application approach this will look a bit more complicated:

1. Perform routing (`app.example.com/user/:username`) and parse the user name from the URL.
2. Call the backend and load the data (`api.example.com/user/:username`).
    1. Perform routing (`api.example.com/user/:username`) and parse the user name from the URL.
    2. Grab the data about user "other" from the database
    4. Perform business logic, security checks and so an to derive the data which is returned to the frontend.
    3. Return a [JSON](https://www.json.org/) structure with the user's data.
3. Perform business logic and derive the data needed for the template to be rendered.
4. Render a template `<div><h1>User {{$username}}</h1> ...` to the DOM.

![Complex](assets/rendering-complex.svg)

Essentially, the implementational effort has doubled.
The frontend needs to do loading of data from the backend, perform business logic and generate the DOM content.
The backend needs to do the same.

While performing the network request towards the backend often is just overhead which can be abstracted or auto generated (but will never completely vanish), often tasks like validation or other business logic will be duplicated between the frontend and backend application.

In addition to logic and interfacing overhead, (mental) abstractions such as classes or interfaces for objects will also be duplicated between the backend and frontend part of the project.

### Using different technologies

With an increased system landscape the number of used technologies and the diversity of the stack will increase.
Even when having specialized teams for each sub application which can deal with its own stack well, the overall maintainability of the application will decrease.
When the project eventually goes into a passive maintenance phase and the number of developers is reduced, each developer will need to be experienced in more technologies or more developers will be needed.
Even while still actively developing the application, there will be need for interoperability as well as a general understanding of the whole system's landscape.

### Dependencies between sub-projects

When dealing with multiple sub projects, these projects will have to somehow interface with each other and hence depend on each other.
These kind of dependencies need to be closely watched and governed.
For example breaking changes in the backend's API need to be dealt with, communication needs to be performed and the migration of all depending sub projects needs to be coordinated.

### Deployment and operating

The bigger the system landscape and the more services with diverse stacks are active, the more complicated deployment and operating will get ([just take a look where modern DevOps has taken us](https://dzone.com/articles/top-5-ways-to-tame-kubernetes-complexity)).
Different containers for all sub project's stacks need to be developed and maintained, services need to be stopped and started in the correct order, ingress needs to be controlled and so on.
Classic template rendered ([CGI](https://en.wikipedia.org/wiki/Common_Gateway_Interface)) systems simply need a plugin for your web server and you are good to go.

### Security

With a growing landscape of services the number and scale of APIs will grow.
And with a growing API, the potential for [security vulnerability will also grow](https://dzone.com/articles/microservices-security-big-vulnerabilities-come-in).
While classical solutions might not at all expose any internal APIs to the outside world, single-page applications heavily rely on a fully published (and hence potentially fully vulnerable) API shared across services.

## So why bother?

While a set of sub projects surely adds to the project's complexity and introduces a set of problems it solves some of the most fundamental problems in modern software development:

- **Scalability.** A set of services (even only a frontend separated from the backend) is much more scalable than a monolith.
- **Domain specific solutions.** Using multiple services allows to utilize the best technology for each use case, as long as all services fall back to a common API.
- **Expert Teams.** When developing a large application, different experts might be needed. You might for example have a team of data scientists running your classifications, an AI expert developing something consuming your classified data, a team for the frontend, closely cooperating with Design and UX, and so on. Splitting your project into multiple sub project can help your teams to stay independent and focused.
- **Deprecated components.** Over time, the used technologies of parts of your application will become deprecated. This is most commonly the case in the user-facing presentation tier. Designers tend to refurbish the design every other year and UX is a process which is never finished. It is much easier to replace individual sub projects than replacing parts of a monolithic application.

The major reason for choosing a more complex stack is often that it is foreseeable that the project will be developed for a long time and a simple stack would not suffice.

![Simple vs complex](assets/simple-vs-complex.svg)

By choosing the more complex stack you can make sure that your application will still be maintainable and extendable after the initial effort has been done.

## Conclusion

Giving up a traditional stack with a monolithic backend generating a frontend using template rendering and splitting your application into individual services introduces a set of problems.
While introducing new problems, at the same time a set of fundamental problems of many projects can be solved using this approach.
