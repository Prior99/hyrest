# Hyrest Express

<img align="right" width="200" height="200" src="https://github.com/Prior99/hyrest/raw/master/logo/hyrest-logo-400px.png">

[![npm](https://img.shields.io/npm/v/hyrest-express.svg)](https://www.npmjs.com/package/hyrest-express)
[![pipeline status](https://gitlab.com/prior99/hyrest/badges/master/pipeline.svg)](https://github.com/Prior99/hyrest)
[![coverage report](https://gitlab.com/prior99/hyrest/badges/master/coverage.svg)](https://github.com/Prior99/hyrest)

Hyrest is a hybrid REST framework for both the client and the server.

**This is the express middleware package.**

Connect your [hyrest](../hyrest) controllers to [Express](http://expressjs.com/) and server them as a REST API.

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

Everything else happens automatically.

## Resources

- [Tutorial](https://prior99.gitlab.io/hyrest/docs/tutorial-about)
- [Minimal example project](https://github.com/Prior99/hyrest-todo-example)
- [Documentation](https://prior99.gitlab.io/hyrest/)
- [Guide](https://prior99.gitlab.io/hyrest/docs/preamble-about/)
- [API Reference](https://prior99.gitlab.io/hyrest/api/hyrest-express/)
