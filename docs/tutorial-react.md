---
id: tutorial-react
title: 11. Setup React
---

A simple basic react setup is necessary.
Create a directory `src/web` and place a file `index.tsx` in it.
This will be the entrypoint for our website:

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";

ReactDOM.render(
    <div>
        Hello, world.
    </div>,
    document.getElementById("root"),
);
```

Take a look at the [React getting started guide](https://reactjs.org/docs/hello-world.html) if this confuses you.

After starting the website, you should see a webpage with "Hello, world." on it.
