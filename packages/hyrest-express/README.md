# Hyrest Express

[![npm](https://img.shields.io/npm/v/hyrest.svg)](https://www.npmjs.com/package/hyrest)
[![Build Status](https://travis-ci.org/Prior99/hyrest.svg?branch=master)](https://travis-ci.org/Prior99/hyrest)
[![Coverage Status](https://coveralls.io/repos/github/Prior99/hyrest/badge.svg?branch=master)](https://coveralls.io/github/Prior99/hyrest?branch=master)

Hyrest is a hybrid REST framework for both the client and the server.

This is the express middleware package.

The idea is to define routes using decorators and use them to both serve the REST endpoint
and call them from the frontend. When developing both server and client in the same repository
or sharing a common library with all endpoints between the both, a call to a REST endoint
is transparent, type-safe and as easy calling a method.

## Usage

Use the `hyrest` middleware to connect your controllers to express:

```typescript
import { hyrest } from "hyrest-express";
import * as Express from express;
import * as BodyParser from "body-parser";
import { UserController } from "./user-controller";
import { GameController } from "./game-controller";

const app = Express();
app.use(Bodyparser.json());
app.use(hyrest(
    new UserController(),
    new GameController(),
));

app.listen(3000);
```

Everything else happens magically.
