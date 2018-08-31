# Hyrest

<img align="right" width="200" height="200" src="https://github.com/Prior99/hyrest/raw/master/logo/hyrest-logo-400px.png">

[![pipeline status](https://gitlab.com/prior99/hyrest/badges/master/pipeline.svg)](https://github.com/Prior99/hyrest)
[![coverage report](https://gitlab.com/prior99/hyrest/badges/master/coverage.svg)](https://github.com/Prior99/hyrest)

Hyrest is a hybrid REST framework for both the client and the server.

The idea is to define routes using decorators and use them to both serve the REST endpoint
and call them from the frontend. When developing both server and client in the same repository
or sharing a common library with all endpoints between the both, a call to a REST endpoint
is transparent, type-safe and as easy calling a method.

## Packages

Hyrest is maintained in a [monorepo using lerna](https://lernajs.io/). These packages are included:

 * [hyrest](packages/hyrest)
 * [hyrest-express](packages/hyrest-express)
 * [hyrest-mobx](packages/hyrest-mobx)
 * [example](packages/example)

## Resources

- [Tutorial](https://prior99.gitlab.io/hyrest/docs/tutorial-about)
- [Minimal example project](https://github.com/Prior99/hyrest-todo-example)
- [Documentation](https://prior99.gitlab.io/hyrest/)
- [Guide](https://prior99.gitlab.io/hyrest/docs/preamble-about/)
- [API Reference](https://prior99.gitlab.io/hyrest/api/hyrest-mobx/)

## Contributing

Contributions in the form of well-documented issues or pull-requests are welcome.

## Contributors

 - Frederick Gnodtke
