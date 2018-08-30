---
id: introduction-architectural-inspirations
title: Architectural Inspirations
---

Hyrest does not solve all problems your project might have and does not come with an oppinionated set of peer-dependencies.
Hyrest is framework-agnostic in every way and neither dictates what to use in the frontend, the networking library to rely on, the database to store your data in or a project structure to use.
You have the full freedom of designing your application's stack as you need it.

Still, an suggested set of patterns and architectural decisions that work well together exists.
This will be the basics for the [suggested companion technologies](introduction-companion-technologies) which have been found to work well with Hyrest and for some of which connectors have been implemented.

This sections wants to give you some inspirations about how to structure and design your application in both frontend and backend.

## Properly layer your application

Take a look at [Anatomy](preamble-anatomy) and consider structuring your application in a similar way.
Other frameworks such as [ionic in its example app](https://github.com/ionic-team/ionic-conference-app/tree/master/src/app) already suggest (or enforce) a certain given structure.
Even though Hyrest does not force a specific "cut" in your project it is probably a good idea to think about a structure.

The following rough layers have proofen useful not only for JavaScript framework [but for other frameworks, too](http://exploreflask.com/en/latest/organizing.html):

- **Models**: Keep a set of models for your [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) or simply as interfaces for the controllers organized in a flat structure and well documented.
- **Controllers**: Controllers are used in the backend as well as the frontend and should be organized in a flat structure next to the models. Controllers can directly communicate with your database or use another layer between the actual database and the controllers. This layer could be an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping).
- **State-Management**: Make sure to use a [state-management](https://stateofjs.com/2017/state-management/other/) in the frontend.
- **Rendering**: Decide for one of the various modern frontend frameworks [I recommend React](https://reactjs.org/) and implement the rendering using it. Pay attention to keep this small, clean of logic and think about using a [component library](https://hackernoon.com/23-best-react-ui-component-libraries-and-frameworks-250a81b2ac42) to further separate design from UX and layout.

## Define Models

Treat important interfaces such as database models and classes used as interfaces for exchange through the Api as with respect.
Define models with proper documentation in individual classes and use them as a base for your application.
Infer your database schema, parts of your controller-infrastructure and perhaps even some components in the frontend from the set of models.

## Use an ORM

ORMs are very popular outside of the JavaScript ecosystem ([SQLAlchemy](https://www.sqlalchemy.org/), [Hibernate](http://hibernate.org/orm/), [ODB](https://codesynthesis.com/products/odb/), [Diesel](http://diesel.rs/), [Doctrine](https://www.doctrine-project.org/)).
And when implementing your backend in a fairly new language like JavaScript, you should certainly learn from other ecosystems that have been around for a while.

ORMs provide a nice abstraction over different databases.
This can serve as an additional layer between your database and models and your controllers.
When using an ORM with models explicitly declared as classes ([Typeorm](http://typeorm.io)) your models can be used for the database as well as as interfaces for the controllers which can ome in pretty handy.

## Directory structure

Many frameworks come with scaffolding tools or boilerplates creating a given directory structure.
Much like the [Flask's guide about Larger applications](http://flask.pocoo.org/docs/0.12/patterns/packages/) an inspiration for structuring your project will be provided here.

### Small and medium sized applications

For simple applications with exact one backend and one (web-)frontend, your project structure might look like this.

```text
project-root
├── src
│   ├── common
│   │   ├── controllers
│   │   │   └── ...
│   │   ├── models
│   │   │   └── ...
│   │   └── utils
│   │       └── ...
│   ├── server
│   │   └── ...
│   └── web
│       ├── components
│       │   └── ...
│       ├── pages
│       │   └── ...
│       ├── store
│       │   └── ...
│       └── utils
│           └── ...
└── test
    └── ...
```

A `package.json` with targets for `build:web`, `build:server`, `start:web`, `start:server`, etc. as well as configuration files for everything would go into the project's root directory.

> I suggest adding merged steps like `build` and `start` to the `package.json` or better yet, add a `Makefile`.

> I recommend to keep a `test` directory at the application's root for integration testing of the whole application and perhaps put unit-test nested into the project's structure.

Code in `server/` and `web/` can import from `common/` but not the other way around nor can `server/` and `client/` import from each other.

### Multiple frontends

When implementing a project with multiple frontends (web as well as Android and iOS apps for example), split out the `store` and `utils` directory into a `ui` directory and keep a separate directory for each frontend. e.g.:

```text
project-root
├── src
│   ├── common
│   │   └── ...
│   ├── server
│   │   └── ...
│   ├── ui
│   │   ├── store
│   │   │   └── ...
│   │   └── utils
│   │       └── ...
│   ├── web
│   │   └── ...
│   ├── android
│   │   └── ...
│   └── ios
│       └── ...
└── test
    └── ...
```

### Even larger applications

When dealing with applications of a size where multiple services for the backend makes sense, consider developing domain-specific packages with a set of controllers, utilities and models each.
Take a look at [lerna](https://github.com/lerna/lerna) and [yarn workspaces](https://yarnpkg.com/en/docs/workspaces).

## Make your presentation tier exchangable

[Frontends tend to be rebrushed every other year](https://web.archive.org/web/20080807015216/twitter.com) and you should keep that in mind when designing your project's architecture.
You will probably iterate on your whole project heavily in the initial phases, but after a while your business logic and persistence tier will settle down and act as a foundation for your project.

Redesigns happen, and it is a good idea to plan ahead for them.

> Especially when developing an application for young startups, the initial design might be a prototype which needs to be exchanged for a real design later.

Put effort into separating your presentation tier from your frontend's logic, networking and state-management.


## Centralize frontend data-keeping

It has been a trend recently to centralize your frontend's data in one monolithic store and generating the markup from it.
This pattern is utilized by many popular libraries such as [redux](https://redux.js.org/), [vuex](https://vuex.vuejs.org/), [ngxs](https://github.com/ngxs/store) and many more.

Independently of what framework you decide for, it is a good idea to honor this pattern and it has proven to work well together with Hyrest.

When using [MobX](https://github.com/mobxjs/mobx), consider creating domain-specific or resource-specific stores at a central point and use [dependency injection](#dependency-injection) to connect them to your components.

## Don't mix up Markup and dataflow

Imagine you store your frontend's runtime data in a single big object [such as redux does](https://redux.js.org/), mapping to a markup:

```typescript
const appState = {
    currentUser: "36fad161-0b42-459d-bbc4-71053b2a1601",
    users: {
        "36fad161-0b42-459d-bbc4-71053b2a1601": {
            name: "someone",
            age: 26
        },
        "55428be6-f221-4776-bda9-a3399c61e46b": {
            name: "anotherone",
            age: 19
        }
    },
    ageLimit: 21
};
```

When having a markup structure such as this one:

```typescript
<App>
    <UserList>
        <Statistics>
            <WidgetTotalAge />
            <WidgetUsersAboveAgeLimit />
        </Statistics>
        <User />
        <User />
    </UserList>
</App>
```

It might seem like a good idea to hand down the data as it was done in a React/Redux stack before [connect](https://github.com/reduxjs/react-redux/blob/master/docs/api.md) became popular.
So, the `<App />` component might hand the `users` array and `ageLimit` as properties to `<UserList />`, which then hands it down to `<Statistics />` and so on.

This will work for the time being, doesn't require any additional effort and keeps the components unconnected, but comes with one big drawback: **When rearranging your markup, you will have to change the dataflow.**

Image you are adding a sidebar with the `<WidgetTotalAge />` which previously resided in the `<Statistics />` component.

Let's assume the `<Statistics />` component calculated the summed up age of all users and handed it down to the widget component: `<WidgetTotalAge totalAge={45} />`.
When adding a `<Sidebar />` next to `<UserList />` as direct child of `<App />`, you will have to hand it all the properties you handed to `<UserList />`, which makes rearranging components much harder.

Rearranging components will be a common task after your initial application has been written, as [UX is a continuous process](https://ubilabs.net/en/news/ux-design-a-continuous-process-2016-02-02) affecting the structure of your markup.

The way the data reaches your components should be orthogonal to the structure of your markup.
Only use properties for the absolute minimum set of information available (for a card representing a user it might just be the id of the user), and grab anything else from within the component.
This is what [react-redux](https://github.com/reduxjs/react-redux) and other state management patterns such as [vuex](https://vuex.vuejs.org/) suggest.

React's new [context api](https://reactjs.org/docs/context.html) basically solves it in a similar way, but not quite.
It depends on a *Provider* being the parent of all components consuming the data which is (in my personal oppinion) still a flawed concept.

## Dependency Injection

As stated in [the previous section](don-t-mix-up-markup-and-dataflow), it is a good idea to separate markup and data flow to keep your application's layout flexible.
Especially in the Java ecosystem, dependency injection has been a trend long since.
Major ecosystems such as [Java Spring](https://docs.spring.io/spring-boot/docs/current/reference/html/using-boot-spring-beans-and-dependency-injection.html) or [Android](http://square.github.io/dagger/) encourage the use of such dependency injectors and multiple [agnostic solutions](https://github.com/google/guice) have been published since.

Dependency injection can help your project in the backend for injecting the database or different controllers as well as in the frontend for injecting controllers and stores into components.
Take a look at dependency injectors as a structure for your project to avoid singletons, get control over startup and teardown of your backend and solve the problem of accessing your statemanagement from your components.

## Conclusion

Hyrest does not come with a predefined structure for your project, a scaffolding-preset or a boilerplate.
You should structure everything the way your project needs it but perform some research beforehand and look for inspiration especially in ecosystems that have been around for a while.
