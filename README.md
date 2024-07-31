# PP-Finder

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

For instance, let's find prototype pollution gadgets in the popular express library:

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

It will use the `--loader` options from nodejs to perform ast modifications on the fly.

```shell
$ node --loader pp-finder ./index.js
```

Alternatively, you can use the **pp-finder** CLI:

```shell
$ pp-finder run node ./index.js
```

From now, if you run the application, it will output all the potential gadgets:

```
[PP][prop] "prepareStackTrace" at node_modules/depd/index.js:384:20
[PP][prop] "noDeprecation" at node_modules/depd/index.js:154:15
[PP][prop] "NO_DEPRECATION" at node_modules/depd/index.js:159:25
[PP][prop] "traceDeprecation" at node_modules/depd/index.js:170:15
[PP][prop] "TRACE_DEPRECATION" at node_modules/depd/index.js:175:25
[PP][prop] "hasOwnProperty" at node_modules/merge-descriptors/index.js:22:39
[PP][prop] "type" at node_modules/debug/src/index.js:6:47
[PP][prop] "DEBUG_FD" at node_modules/debug/src/node.js:61:31
[PP][prop] "DEBUG" at node_modules/debug/src/node.js:157:22
[PP][prop] "DEBUG" at node_modules/debug/src/node.js:143:24
[PP][isIn] "colors" at node_modules/debug/src/node.js:76:22
[PP][forIn] "_" at node_modules/debug/src/debug.js:47:13
Example app listening on port 3000
```

Now, if you issue a request to that server, more gadgets show up:

```
[PP][elem] "filename" at node_modules/ejs/lib/utils.js:167:23
[PP][elem] "async" at node_modules/ejs/lib/utils.js:167:23
[PP][prop] "scope" at node_modules/ejs/lib/ejs.js:387:20
[PP][forIn] "_" at node_modules/ejs/lib/utils.js:243:17
[PP][prop] "openDelimiter" at node_modules/ejs/lib/ejs.js:523:57
[PP][prop] "closeDelimiter" at node_modules/ejs/lib/ejs.js:524:59
[PP][prop] "delimiter" at node_modules/ejs/lib/ejs.js:525:49
[PP][isIn] "ctime" at node_modules/etag/index.js:112:16
[PP][elem] "if-modified-since" at node_modules/fresh/index.js:35:34
[PP][elem] "if-none-match" at node_modules/fresh/index.js:36:30
[...]
```

## CLI

```shell
$ pp-finder --help
PP Finder <subcommand>
> Find prototype pollution gadget in javascript code

where <subcommand> can be one of:

- init - Create a ppfinder.json file in the current directory
- compile - Compile the specified file
- run - Run a command with pp-finder:
  ex: pp-finder run -c ./ppfinder.json  -- node test.js

For more help, try running `PP Finder <subcommand> --help`
```

## Runtime Configuration

You can generate the default pp-finder configuration file using `pp-finder init`.

You can override the behaviour of PP finder using environment variables:

| Environment        | Type              | Description                                                                  |
| :----------------- | :---------------- | :--------------------------------------------------------------------------- |
| `PPF_WRAPPER_NAME` | string            | Wrapper name, defaults to `ø`                                                |
| `PPF_LOGONCE`      | bool              | Only log each finding once, defaults to `false`                              |
| `PPF_COLOR`        | bool              | Disable colorization, defaults to `true`                                     |
| `PPF_LAZYSTART`    | bool              | Lazy start whether to wait for `pp-finder start` or not, defaults to `false` |
| `PPF_POLLUTABLES`  | string[]          | Comma separated list of pollutable objects. Defaults to `["Object"]`         |
| `PPF_AGENT`        | 'node', 'browser' | Agent to use for compilation only. Defaults to `node`                        |
| `PPF_TRANSFORMERS` | string[]          | Comma separated list of transformers. Defaults to `all`                      |
| `PPF_SKIP`         | string (regex)    | Skip packages that match the regex ( loader only )                           |

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
[PP][forIn] "_" at node_modules/debug/src/debug.js:47:13
[PP][forIn] "_" at node_modules/debug/src/debug.js:47:13
[PP][forIn] "_" at node_modules/debug/src/debug.js:47:13
[PP][forIn] "_" at node_modules/debug/src/debug.js:47:13
[PP][forIn] "_" at node_modules/debug/src/debug.js:47:13
[PP][forIn] "_" at node_modules/debug/src/debug.js:47:13
[PP][forIn] "_" at node_modules/safe-buffer/index.js:8:19
[PP][forIn] "_" at node_modules/debug/src/debug.js:47:13
[PP][forIn] "_" at node_modules/mime/mime.js:22:20
[PP][elem] "0" at node_modules/mime/mime.js:35:36
[PP][elem] "0" at node_modules/mime/mime.js:35:36
[PP][elem] "0" at node_modules/mime/mime.js:35:36
[PP][elem] "0" at node_modules/mime/mime.js:35:36
[PP][elem] "0" at node_modules/mime/mime.js:35:36
[PP][elem] "0" at node_modules/mime/mime.js:35:36
```

## Advanced Usage

### Lazy start

Most of the time, you only want gadget that are reachable after the pollution point. You can tell pp-finder to start lazely and wait for the `"pp-finder start";` instruction

```javascript
const express = require('express')
const app = express()
const port = 3000

"pp-finder start";

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

```

This way you won't see any gadgets found during the loading of express and its dependencies. 

Also, you can use the `"pp-finder stop";` instruction to stop the gadget finder.

> Warning, keep in mind that the start/stop instructions will only affect the logging, but not the instrumentation

> If you need to stop pp-finder from instrumenting specific file/package, use the skip option with a regex instead.

## Tests

Tests indicate what the library handles in terms of AST visitors:

```shell
$ make test
Building loader
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
