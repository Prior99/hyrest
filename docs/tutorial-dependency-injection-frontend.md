---
id: tutorial-dependency-injection-frontend
title: 12. Dependency injection (again)
---

The frontend will also be using dependency injection, much [like already setup in the backend](tutorial-dependency-injection).

## Setup TSDI

Add the same lines of code to your `src/web/index.tsx` as you added to your `src/server/index.ts`:

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { TSDI } from "tsdi";

const tsdi = new TSDI();
tsdi.enableComponentScanner();

ReactDOM.render(
    ...
);
```

## Configure controllers

In order to make the controllers available for injection, they need to be imported.
A simple `import "../common";` would be enough, but we need to configure the controllers, as they need to know how to reach the backend.
Add the following to your frontend's setup.

```typescript
import { configureController } from "hyrest";
import { allControllers } from "../common";

configureController(allControllers, { baseUrl: "http://localhost:4000" });
```

## Summary

After all the configuration is done, your `index.tsx` should look like this:

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { TSDI } from "tsdi";
import { configureController } from "hyrest";
import { allControllers } from "../common";

configureController(allControllers, { baseUrl: "http://localhost:4000" });

const tsdi = new TSDI();
tsdi.enableComponentScanner();

ReactDOM.render(
    <div>
        Hello, world.
    </div>,
    document.getElementById("root"),
);
```
