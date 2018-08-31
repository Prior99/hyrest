---
id: tutorial-webpack
title: 10. Setup Webpack
---

Hyrest will include the backend's code in the frontend. If this is of concern to you, [reconsider your security concept](https://en.wikipedia.org/wiki/Security_through_obscurity#Criticism).
As the code will be included but not really executed, it is necessary to configure Webpack to ignore certain dependencies.

## Basic configuration

Create a basic Webpack configuration in a file named `webpack.config.js`.
Refer to [Webpack's documentation](https://webpack.js.org/) for further insights of what is happening here.

The configuration should look like this:

```javascript
const path = require('path');

module.exports = {
    mode: "development",
    entry:  path.join(__dirname, "src", "web"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js",
        publicPath: "/dist"
    },
    resolve: {
        extensions: [".js"]
    },
    devtool: "source-map",
    devServer: {
        port: 4001,
        historyApiFallback: true
    }
};

```

This is all pretty much boilerplate and will not be explained here.

## Typescript

Hyrest is using [Typescript](https://www.typescriptlang.org), so support is needed in Webpack.
Two major loaders for Typescript and Webpack exist:

- [awesome-typescript-loader](https://github.com/s-panferov/awesome-typescript-loader): Unofficial alternative.
- [ts-loader](https://github.com/TypeStrong/ts-loader): Recommended loader.

We will be using [ts-loader](https://github.com/TypeStrong/ts-loader) in this tutorial.

Let's tell Webpack to resolve `.ts` and `.tsx` files and use `ts-loader` to load them:

```javascript
module.exports = {
    ...

    resolve: {
        extensions: [".js", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?/,
                loader: "ts-loader"
            }
        ]
    },

    ...
};
```

## Typeorm

Typeorm is used from the browser's side but not really executed.
Typeorm comes with browser support, but the entrypoint for that is in another file.
We need to tell Webpack to rewrite all includes of `"typeorm"` to `"typeorm/browser"`.

This can be done via an [alias](https://webpack.js.org/configuration/resolve/#resolve-alias):

```javascript
const path = require('path');

module.exports = {
    ...

    resolve: {
        extensions: [".js", ".ts", ".tsx"],
        alias: {
            "typeorm": "typeorm/browser"
        }
    },

    ...
};
```

> A cleaner better way would have been to use the [NormalModuleReplacementPlugin](https://webpack.js.org/plugins/normal-module-replacement-plugin/).
> But an alias works fine as well and is more known.

## Add a generic index.html

Add a file `index.html` to your project's root with the following content:

```
<!DOCTYPE HTML>
<html>
    <head>
        <title>Hyrest todo example</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    </head>
    <body>
        <div id="root"></div>
        <script src="dist/bundle.js"></script>
    </body>
</html>
```

This file will simply load the bundle and provide an empty `div` element into which the react root component will be rendered.

## Add a start script

For easy start of the development server, add a script to your `package.json`:

```json
{
  ...

  "scripts": {
    "start:server": "ts-node src/server",
    "start:web": "webpack-dev-server"
  },

  ...
}
```

You can afterwards start your website using `yarn start:web` and reach it under `localhost:4001`.
