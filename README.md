# Hyrest

<img align="right" width="200" height="200" src="https://github.com/Prior99/hyrest/raw/master/logo/hyrest-logo-400px.png">

[![npm](https://img.shields.io/npm/v/hyrest.svg)](https://www.npmjs.com/package/hyrest)
[![pipeline status](https://gitlab.com/prior99/hyrest/badges/master/pipeline.svg)](https://github.com/Prior99/hyrest)
[![coverage report](https://gitlab.com/prior99/hyrest/badges/master/coverage.svg)](https://github.com/Prior99/hyrest)

Hyrest is a hybrid REST framework for both the client and the server.

The idea is to define routes using decorators and use them to both serve the REST endpoint
and call them from the frontend. When developing both server and client in the same repository
or sharing a common library with all endpoints between the both, a call to a REST endpoint
is transparent, type-safe and as easy calling a method.

## Resources

Take a look at the official website at [prior99.gitlab.io/hyrest](https://prior99.gitlab.io/hyrest/).
It features a [tutorial](https://prior99.gitlab.io/hyrest/docs/tutorial-about/) for implementing a minimal full-stack todo-list application.

## Packages

Hyrest is maintained in a [monorepo using lerna](https://lernajs.io/). These packages are included:

 * [hyrest](packages/hyrest)
 * [hyrest-express](packages/hyrest-express)
 * [hyrest-mobx](packages/hyrest-mobx)
 * [example](packages/example)

## Contributing

Contributions in the form of well-documented issues or pull-requests are welcome.

## Contributors

 - Frederick Gnodtke
