# Hyrest

[![npm](https://img.shields.io/npm/v/hyrest.svg)](https://www.npmjs.com/package/hyrest)
[![Build Status](https://travis-ci.org/Prior99/hyrest.svg?branch=master)](https://travis-ci.org/Prior99/hyrest)
[![Coverage Status](https://coveralls.io/repos/github/Prior99/hyrest/badge.svg?branch=master)](https://coveralls.io/github/Prior99/hyrest?branch=master)

Hyrest is a hybrid REST framework for both the client and the server.

The idea is to define routes using decorators and use them to both serve the REST endpoint
and call them from the frontend. When developing both server and client in the same repository
or sharing a common library with all endpoints between the both, a call to a REST endoint
is transparent, type-safe and as easy calling a method.

## Table of contents

 * [Hyrest](#hyrest)
     * [Table of contents](#table-of-contents)
     * [Packages](#packages)
     * [Contributing](#contributing)
         * [Building](#building)
         * [Running the tests with coverage](#running-the-tests-with-coverage)
         * [Linting](#linting)
         * [Starting the example](#starting-the-example)
     * [Contributors](#contributors)

## Packages

Hyrest is maintained in a [monorepo using lerna](https://lernajs.io/). These packages are included:

 * [hyrest](packages/hyrest)
 * [hyrest-express](packages/hyrest-express)
 * [example](packages/example)

## Contributing

Yarn is used instead of npm, so make sure it is installed, probably: `npm install -g yarn`.

Install all dependencies using

```
yarn install
```

### Building

In order to build the code:

```
yarn build
```

### Running the tests with coverage

```
yarn test
```

### Linting

```
yarn lint
```

### Starting the example

Server:

```
cd exmaple
yarn run:server
```

Client:

```
cd exmaple
yarn run:client
```

## Contributors

 - Frederick Gnodtke
