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

> Also tested with node v20.2.0 using `--loader` instead

```shell
$ node --experimental-loader pp-finder ./index.js
$ node --loader pp-finder ./index.js
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

| Environment      | Type                        | Description                                                                  |
| :--------------- | :-------------------------- | :--------------------------------------------------------------------------- |
| PPF_WRAPPER_NAME | string                      | Wrapper name, defaults to `ø`                                                |
| PPF_LOGONCE      | bool                        | Only log each finding once, defaults to `false`                              |
| PPF_COLOR        | 'auto', 'always' or 'never' | Disable colorization, defaults to `auto`                                     |
| PPF_LAZYSTART    | bool                        | Lazy start whether to wait for `pp-finder start` or not, defaults to `false` |
| PPF_LOGFILE      | string                      | File to log gadgets to                                                       |
| PPF_POLLUTABLES  | string[]                    | Pollutable objects. Defaults to `["Object"]`                                 |
| PPF_AGENT        | 'loader', 'node','browser'  | Agent to use. Defaults to `loader`                                           |
| PPF_TRANSFORMERS | string[]                    | Transformers to use. Defaults to `all`                                       |


### PPF_TRANSFORMERS

You can choose which transformers to use for the compilation. By defaults all are selected:

```ts
const defaultTransformers = [
  'elementAccess',
  'expressionStatement',
  // 'callExpression', // TODO: unstable, doesn't work for some target
  'propertyAccess',
  'variableDeclaration',
  'objectLiteral',
  'forInStatement',
  'inExpression',
  'arrowFunction',
  'functionDeclaration',
  'functionExpression',
];
```

Example (Only forIn and elem are used): 

```shell
$ PPF_TRANSFORMERS=forInStatement,elementAccess node --loader pp-finder ../targets/express/index.js
[PP][forIn] _ [...]/targets/express/node_modules/debug/src/debug.js 47:13
[PP][forIn] _ [...]/targets/express/node_modules/safe-buffer/index.js 8:19
[PP][forIn] _ [...]/targets/express/node_modules/debug/src/debug.js 47:13
[PP][forIn] _ [...]/targets/express/node_modules/mime/mime.js 22:20
[PP][elem]  0 [...]/targets/express/node_modules/mime/mime.js 35:36
[PP][elem]  0 [...]/targets/express/node_modules/mime/mime.js 35:36
[PP][elem]  0 [...]/targets/express/node_modules/mime/mime.js 35:36
```

## Dev

```shell
$ yarn dev
$ node --loader ./dist/loader.cjs file.js
```

## Tests

Tests indicate what the library handles in terms of AST visitors:

```shell
$ yarn test
Building loader
Building compiler
Starting tests
Running test: arrowFunctionDeclaration.test.js
Running test: assignation.test.js
Running test: awaitAssign.test.js
Running test: classPrivateFields.test.js
Running test: elementAccessExpression.test.js
Running test: eval.test.js
Running test: forInStatement.test.js
Running test: functionCall.test.js
Running test: functionDeclaration.test.js
Running test: functionExpression.test.js
Running test: inExpression.test.js
Running test: lazyStart.test.js
Running test: nullish.test.js
Running test: objectLiteral.test.js
Running test: propertAccessExpression.test.js
Running test: statefullGetter.test.js
Running test: variableDeclaration.test.js
```
