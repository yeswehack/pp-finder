# pp-finder

Prototype pollution finder tool for javascript. pp-finder lets you find prototype pollution candidates in your code. The main purpose of this tool is to help hackers in there prototype pollution researchs by highlighting potential candidate in the source code.

For instance, the following candidate will be highlighted by pp-finder:

```javascript
if (options.exec) child_process.exec(options.exec);
```

> Tested with v20.2.0

## Installation

### NPM

```shell
$ npm install -g pp-finder
```

### yarn

```shell
$ yarn global add pp-finder
```

## Getting started

For instance, let's find candidates in the popular express library:

```
$ mkdir -p target/express
$ cd target/express
$ yarn add express
$ # now write a very basic express application
```

```javascript
const express = require("express");

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
```

To hunt for prototype pollution gadgets, pp-finder will parse the javascript source code of every file it finds in the provided directory.

It will use the `--experimental-loader` options from nodejs to perform ast modifications on the fly (Tested with node v18.18.2).

```shell
$ node --experimental-loader pp-finder ./index.js
```

From now, if you run the application, it will output all the available candidates:

```
[PP][IsIn "colors"] node_modules/debug/src/node.js:76:22
[PP][ForIn] node_modules/safer-buffer/safer.js:12:13
[PP][IsIn "colors"] node_modules/debug/src/node.js:76:22
[PP][IsIn "colors"] node_modules/debug/src/node.js:76:22
[PP][IsIn "colors"] node_modules/debug/src/node.js:76:22
[PP][Prop noDeprecation] node_modules/depd/index.js:154:15
[...]
Example app listening on port 3000
```

Now, if you issue a request to that server, even more candidate show up:

```
[PP][Prop params] node_modules/express/lib/router/index.js:156:26
[PP][Prop baseUrl] node_modules/express/lib/router/index.js:157:23
[PP][Elem "baseUrl"] node_modules/express/lib/router/index.js:637:19
[PP][Elem "next"] node_modules/express/lib/router/index.js:637:19
[PP][Elem "params"] node_modules/express/lib/router/index.js:637:19
[...]
```

## Runtime Configuration

You can configure the behaviour of PP finder using env variable:

| Environment      | Type                        | Description                                            |
| :--------------- | :-------------------------- | :----------------------------------------------------- |
| PPF_CONFIG_PATH  | string                      | Path to config file, defaults to `./ppf.config.json`   |
| PPF_LOGONCE      | bool                        | Only log each finding once, defaults to `false`        |
| PPF_COLOR        | 'auto', 'always' or 'never' | Disable colorization, defaults to `false`              |
| PPF_WRAPPER_NAME | string                      | Wrapper name, defaults to `ø`                          |
| PPF_POLLUTABLE   | string[], comma separated   | Pollutable objects, defaults to `["Object.prototype"]` |
| PPF_LOG_FORIN    | bool                        | Log `for (y in x)` gadgets, defaults to `true`         |
| PPF_LOG_ISIN     | bool                        | Log `y in x` gadgets, defaults to `true`               |
| PPF_LOG_PROP     | bool                        | Log `x.y` gadgets, defaults to `true`                  |
| PPF_LOG_ELEM     | bool                        | Log `x[y]` gadgets, defaults to `true`                 |
| PPF_LOG_BIND     | bool                        | Log `{y} = x` gadgets, defaults to `true`              |

## Tests

Tests indicate what the library handles in terms of AST visitors:

```shell
$ yarn test
  Hooks
    PropertyAccessExpression
      ✔️ Valid Gadget     | ({}).y
      ✔️ Not Valid Gadget | ({y: 42}).y
      ✔️ Not Valid Gadget | (Object.create(null)).y
      ✔️ Valid Gadget     | ({y: {}}).y.z
    ElementAccessExpression
      ✔️ Valid Gadget     | ({})['y']
      ✔️ Not Valid Gadget | ({y: 42})['y']
      ✔️ Not Valid Gadget | (Object.create(null))['y']
      ✔️ Valid Gadget     | ({y: {}})['y']['z']
    ForInStatement
      ✔️ Valid Gadget     | for(let y in ({})){}
      ✔️ Not Valid Gadget | for(let y in (Object.create(null))){}
    ArrowFunctionDeclaration
      ✔️ Valid Gadget     | (({y}) => (0))({})
      ✔️ Valid Gadget     | (({y}, a, {z}) => (0))({}, 0, {})
      ✔️ Valid Gadget     | (({y: z}) => (0))({})
    FunctionDeclaration
      ✔️ Valid Gadget     | function f({y}){return};f({})
      ✔️ Valid Gadget     | function f({y}, a, {z}){return};f({}, 42, {})
      ✔️ Valid Gadget     | function f({y: z}){return};f({})
      ✔️ Valid Gadget     | function f({['y']: z}){return};f({})
    FunctionExpression
      ✔️ Valid Gadget     | (function ({y}){return})({})
      ✔️ Valid Gadget     | (function ({y}, a, {z}){return})({}, 0, {})
      ✔️ Valid Gadget     | (function ({y: z}){return})({})
      ✔️ Valid Gadget     | (function ({['y']: z}){return})({})
    InExpression
      ✔️ Valid Gadget     | ("y" in {})
      ✔️ Not Valid Gadget | ("y" in {y: 42})
      ✔️ Not Valid Gadget | ("y" in Object.create(null))
    ObjectLiteral
      ✔️ Valid Gadget     | ({y} = {});
      ✔️ Valid Gadget     | ({y: {z}} = {y: {}});
      ✔️ Not Valid Gadget | ({y} = {y: 42});
      ✔️ Not Valid Gadget | ({y} = Object.create(null));
      ✔️ Valid Gadget     | ({['y']: y} ={});
    VariableDeclaration
      ✔️ Valid Gadget     | const {y} = {};
      ✔️ Valid Gadget     | const {y} = {}, {z} = {};
      ✔️ Valid Gadget     | const {y: {z}} = {y: {}};
      ✔️ Not Valid Gadget | const {y} = {y: 42};
      ✔️ Valid Gadget     | const {['y']: y} ={};
      ✔️ Not Valid Gadget | const {y} = Object.create(null);
      ✔️ Valid Gadget     | let z; const {y} = {z} = {};

  Assignation check
    ✔️ const x = {}; x.y = 42; x.y
    ✔️ const x = {}; x['y'] = 42; x.y


  38 passing (72ms)

Done in 1.61s.


```
