---
id: tutorial-about
title: About
---

Follow this tutorial in which a full-stack todo application will be implemented using Hyrest and its suggested [companion technologies](introduction-companion-technologies).

The example [is published as a git repository](https://github.com/Prior99/hyrest-todo-example) on GitHub with commits for every step.

## Backend

1. [Basic project setup](tutorial-basic): Explanation of all used dependencies and setup of a basic JS project.
2. [Define models](tutorial-models): Define the models for the project used in both the database and for the controllers.
3. [Add a controller](tutorial-controller): Add a first controller handling the model defined in the last step.
4. [Implement the controller's logic](tutorial-controller-logic): In the last step an empty controller was created. Now the actual logic will be implemented.
5. [Dependency Injection](tutorial-dependency-injection): To wire all dependencies, dependency injection needs to be set up.
6. [Express Setup](tutorial-express-setup): In order to serve the API, Hyrest needs to be connected to Express.
7. [Database setup](tutorial-database-setup): The models need to be store somewhere. A database connection needs to be provided by the dependency injector.
8. [Compile the backend](tutorial-compile-backend): The backend is implemented. It can now be compiled, executed and used.
9. [CORS](tutorial-cors): Add [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) support to your backend.

## Frontend

10. [Setup Webpack](tutorial-webpack): Configure Webpack to properly compile the frontend part of the application.
11. [Setup React](tutorial-react): Setup basic react code and render a hello world.
12. [Dependency Injection (Frontend)](tutorial-dependency-injection-frontend): Add dependency injection support for the frontend.
13. [Todo store](tutorial-todo-store): Add a todo store.
14. [List component](tutorial-list-component): Create a component for listing all available todos.
15. [Form component](tutorial-form-component): Create a component with a form for adding new todos.
