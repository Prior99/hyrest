---
id: api-client
title: Usage as client
---

Sometimes you might want to use Hyrest controllers as clients in [Node](https://nodejs.org/).
Just configure the controller and create an instance:

```typescript
import { configureController } from "hyrest";
import { UserController } from "./user-controller";
import { GameController } from "./game-controller";

const options = { baseUrl: "http://localhost:3000" };

configureController(UserController, options);
configureController(GameController, options);

const userController = new UserController();
const gameController = new GameController();

await userController.createUser({
    firstName: "Lorem",
    lastName: "Ipsum",
    favoriteGame: {
        category: "casual",
    },
    email: "lorem.ipsum@example.com",
    password: "12345678",
});

console.log(await gameController.listGames());
```
