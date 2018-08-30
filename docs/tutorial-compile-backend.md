---
id: tutorial-compile-backend
title: 8. Compile the backend
---

The backend is done and we just need to compile and start it.

## Configure Typescript

For compiling we will need a [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) to specify the included files and [compiler options](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

Place a file called `tsconfig.json` into the project's root with the following content:

```json
{
    "compilerOptions": {
        "target": "es6",
        "module": "commonjs",
        "experimentalDecorators": true,
        "jsx": "react",
        "lib": ["es2016", "dom"],
        "emitDecoratorMetadata": true,
        "sourceMap": true
    },
    "include": ["src/"]
}
```

Explanation of the chosen compiler options:

- `"target": "es6"`: Node long since supports ES6 and we will use [webpack](https://webpack.js.org/) to bundle for the browser later.
- `"module": "commonjs"`: Even though node supports ES6, it doesn't support ES modules yet, so we will have to fall back to [CommonJS](http://www.commonjs.org/).
- `"experimentalDecorators": true`: [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) are still an experimental feature in Typescript as the [proposal is still stage 2](https://github.com/tc39/proposal-decorators). This is needed to enable decorator support.
- `"jsx": "react"`: In the frontend, React will be used, hence `"react"`.
- `"lib": ["es2016", "dom"]`: We want to use all ES2016 features and our application will also need to access the browser's DOM.
- `"emitDecoratorMetadata": true`: Needed for Hyrest, TSDI and Typeorm to infer the types from Typescript's typings.
- `"sourceMap": true`: In the browser, source maps will be a great help for debugging.
- `"include": ["src/"]`: Include all source files in the `src/` directory.

## Configure package

Add a `"scripts"` section to your `package.json`:

```json
{
  ...

  "scripts": {
    "start:server": "ts-node src/server"
  },

  ...
}
```

We will be using [ts-node](https://github.com/TypeStrong/ts-node) to launch our application for now. It will automatically compile the files for you and run them using node.

## Start the server

If everything went well, you can now start the server:

```sh
yarn start:server
```

You should see Typeorm logging it's SQL queries.

## Test the API

You are probably eager to test what you just implemented. Grab [curl](https://curl.haxx.se/) or even better: **[httpie](https://httpie.org/)**.

### Create a todo

#### Command

```sh
http post localhost:4000/todos name="First todo" description="My first todo. How awesome is that?"
```

#### Result

```
HTTP/1.1 201 Created
Connection: keep-alive
Content-Length: 193
Content-Type: application/json; charset=utf-8
Date: Thu, 30 Aug 2018 09:28:48 GMT
ETag: W/"c1-HexRZ87VD48h2I/eyTo+STFjmCw"
X-Powered-By: Express

{
    "data": {
        "checked": null,
        "created": "2018-08-30T09:28:48.760Z",
        "deleted": null,
        "description": "My first todo. How awesome is that?",
        "id": "9820986a-815c-42bd-988e-7753a5ffe791",
        "name": "First todo"
    }
}
```

### Get todo by id

#### Command

```sh
http localhost:4000/todo/9820986a-815c-42bd-988e-7753a5ffe791
```

#### Result

```
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 193
Content-Type: application/json; charset=utf-8
Date: Thu, 30 Aug 2018 09:29:42 GMT
ETag: W/"c1-WeVEsdt6LrCx46xSeRMPBmsqbfE"
X-Powered-By: Express

{
    "data": {
        "checked": null,
        "created": "2018-08-30T09:28:48.760Z",
        "deleted": null,
        "description": "My first todo. How awesome is that?",
        "id": "9820986a-815c-42bd-988e-7753a5ffe791",
        "name": "First todo"
    }
}
```

### Check todo

#### Command

```sh
http post localhost:4000/todo/9820986a-815c-42bd-988e-7753a5ffe791/check
```

#### Result

```
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 215
Content-Type: application/json; charset=utf-8
Date: Thu, 30 Aug 2018 09:31:55 GMT
ETag: W/"d7-p2WVv55pJBdZE79XJmb1QyYi8tc"
X-Powered-By: Express

{
    "data": {
        "checked": "2018-08-30T09:31:55.517Z",
        "created": "2018-08-30T09:28:48.760Z",
        "deleted": null,
        "description": "My first todo. How awesome is that?",
        "id": "9820986a-815c-42bd-988e-7753a5ffe791",
        "name": "First todo"
    }
}
```

### List todos

Create some more todos and then list them:

```sh
http post localhost:4000/todos name="Another todo" description="Wow. Even more to do"
http post localhost:4000/todos name="More todo" description="When will I finish all this stuff?"
```

#### Command

```sh
http localhost:4000/todos
```

#### Result

```
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 571
Content-Type: application/json; charset=utf-8
Date: Thu, 30 Aug 2018 09:34:22 GMT
ETag: W/"23b-JVp/VU2gPTQTWcWJA7JOisugXwE"
X-Powered-By: Express

{
    "data": [
        {
            "checked": null,
            "created": "2018-08-30T09:33:46.756Z",
            "deleted": null,
            "description": "When will I finish all this stuff?",
            "id": "dc154a10-00a6-4ad1-b046-300eb860b0ae",
            "name": "More todo"
        },
        {
            "checked": null,
            "created": "2018-08-30T09:33:24.673Z",
            "deleted": null,
            "description": "Wow. Even more to do",
            "id": "2cfa161c-6429-4ec2-99e7-ab8b0cfdb924",
            "name": "Another todo"
        },
        {
            "checked": "2018-08-30T09:31:55.517Z",
            "created": "2018-08-30T09:28:48.760Z",
            "deleted": null,
            "description": "My first todo. How awesome is that?",
            "id": "9820986a-815c-42bd-988e-7753a5ffe791",
            "name": "First todo"
        }
    ]
}
```

### Delete todo

#### Command

```sh
http delete localhost:4000/todo/2cfa161c-6429-4ec2-99e7-ab8b0cfdb924
```

#### Result

```
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 2
Content-Type: application/json; charset=utf-8
Date: Thu, 30 Aug 2018 09:35:08 GMT
ETag: W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"
X-Powered-By: Express

{}
```

When listing the todos afterwards, the deleted todo will no longer be listed.

### Not found

#### Command

```sh
http localhost:4000/todo/012af141-1181-40ed-8e26-8ca0b370a83c
```

#### Result

```
HTTP/1.1 404 Not Found
Connection: keep-alive
Content-Length: 27
Content-Type: application/json; charset=utf-8
Date: Thu, 30 Aug 2018 09:36:27 GMT
ETag: W/"1b-QP5s3wdEUSxDK6ieXsz3pGJEcg0"
X-Powered-By: Express

{
    "message": "No such todo."
}
```

### Failed validation: Unknown properties

#### Command

```sh
http post localhost:4000/todos id=012af141-1181-40ed-8e26-8ca0b370a83c count=48
```

#### Result

```
HTTP/1.1 422 Unprocessable Entity
Connection: keep-alive
Content-Length: 136
Content-Type: application/json; charset=utf-8
Date: Thu, 30 Aug 2018 09:37:54 GMT
ETag: W/"88-+j6Gvl/SBvh/n1H2YHP84obpXYI"
X-Powered-By: Express

{
    "data": {
        "body": {
            "nested": {
                "count": {
                    "errors": [
                        "Unexpected key."
                    ]
                },
                "id": {
                    "errors": [
                        "Unexpected key."
                    ]
                }
            }
        }
    },
    "message": "Validation failed."
}
```

### Failed validation: Name too long

#### Command

```sh
http post localhost:4000/todos name="this string is certainly longer than onehundretandtwentyeight characters and should not pass the validity check as we specified it to not exceed onehundretandtwentyeightcharacters."
```

#### Result

```
HTTP/1.1 422 Unprocessable Entity
Connection: keep-alive
Content-Length: 114
Content-Type: application/json; charset=utf-8
Date: Thu, 30 Aug 2018 09:39:16 GMT
ETag: W/"72-w+au7nNYfpOdEB3Aw3v6UzvLMZk"
X-Powered-By: Express

{
    "data": {
        "body": {
            "nested": {
                "name": {
                    "errors": [
                        "Exceeds maximum length of 128."
                    ]
                }
            }
        }
    },
    "message": "Validation failed."
}
```

> You could actually crash the backend by not providing `name` and `description` as we did not add a `required` validation to it on the model.
