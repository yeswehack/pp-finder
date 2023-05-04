# pp-finder

Prototype pollution finder tool for javascript. pp-finder lets you find prototype pollution candidates in your code. The main purpose of this tool is to help hackers in there prototype pollution researchs by highlighting potential candidate in the source code.

For instance, the following candidate will be highlighted by pp-finder:

```javascript
if (options.exec) child_process.exec(options.exec);
```

## Installation

### NPM

```shell
$ npm install -g pp-finder
```

## Getting started

For instance, let's find candidates in the popular express library:

```
$ mkdir -p target/express
$ cd target/express
$ yarn add express
$ # now write a very basic express application
```

To hunt for prototype pollution gadgets, pp-finder will parse the javascript source code of every file it finds in the provided directory.

It will copy the input directory into a new one with an updated version of the sources.

```shell
$ pp-finder hook ./target/express/node_modules
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

## Commands

### Hook

Add pp-finder hooks to a file or directory.

This will create a backup of each file in ~/.local/share/pp-finder

```shell
$ pp-finder hook --help                                                                                                                                                                              PP-Finder hook
> Instrument a javascript project

ARGUMENTS:
  <Path> - Path of the file or directory to instrument

OPTIONS:
  --name, -n <str> - Wrapper name, (default "ø") [optional]

FLAGS:
  --help, -h - show help
```

Hook a file or directory,

### Restore

Restore the backup (if available) for a file or directory

```shell
PP-Finder restore
> Remove pp-finder hooks from a javascript file or directory

ARGUMENTS:
  <Path> - Path of the file or directory to restore

FLAGS:
  --help, -h - show help
```

### Rehoook

This is moslty for developement purpose, restore and rehook a file / directory

### Purge

Remove all backups

```
PP-Finder purge
> Purge all backups

ARGUMENTS:
  [path] - Path of the file or directory to remove from the backup [optional]

FLAGS:
  --help, -h - show help
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

```
❯ yarn run test
$ mocha test -r ts-node/register 'test/**/*.test.ts'


  Hooks
    PropertyAccessExpression
      ✔ Pollutable     | ({}).y
      ✔ Not Pollutable | ({y: 42}).y
      ✔ Not Pollutable | (Object.create(null)).y
      ✔ Pollutable     | ({y: {}}).y.z
    ElementAccessExpression
      ✔ Pollutable     | ({})['y']
      ✔ Not Pollutable | ({y: 42})['y']
      ✔ Not Pollutable | (Object.create(null))['y']
      ✔ Pollutable     | ({y: {}})['y']['z']
    ForInStatement
      ✔ Pollutable     | for(let y in ({})){}
      ✔ Not Pollutable | for(let y in (Object.create(null))){}
    ArrowFunctionDeclaration
      ✔ Pollutable     | (({y}) => (0))({})
      ✔ Pollutable     | (({y}, a, {z}) => (0))({}, 0, {})
      ✔ Pollutable     | (({y: z}) => (0))({})
    FunctionDeclaration
      ✔ Pollutable     | function f({y}){return};f({})
      ✔ Pollutable     | function f({y}, a, {z}){return};f({}, 42, {})
      ✔ Pollutable     | function f({y: z}){return};f({})
      ✔ Pollutable     | function f({['y']: z}){return};f({})
    FunctionExpression
      ✔ Pollutable     | (function ({y}){return})({})
      ✔ Pollutable     | (function ({y}, a, {z}){return})({}, 0, {})
      ✔ Pollutable     | (function ({y: z}){return})({})
      ✔ Pollutable     | (function ({['y']: z}){return})({})
    InExpression
      ✔ Pollutable     | ("y" in {})
      ✔ Not Pollutable | ("y" in {y: 42})
      ✔ Not Pollutable | ("y" in Object.create(null))
    ObjectLiteral
      ✔ Pollutable     | ({y} = {});
      ✔ Pollutable     | ({y: {z}} = {y: {}});
      ✔ Not Pollutable | ({y} = {y: 42});
      ✔ Not Pollutable | ({y} = Object.create(null));
      ✔ Pollutable     | ({['y']: y} ={});
    VariableDeclaration
      ✔ Pollutable     | const {y} = {};
      ✔ Pollutable     | const {y} = {}, {z} = {};
      ✔ Pollutable     | const {y: {z}} = {y: {}};
      ✔ Not Pollutable | const {y} = {y: 42};
      ✔ Pollutable     | const {['y']: y} ={};
      ✔ Not Pollutable | const {y} = Object.create(null);
      ✔ Pollutable     | let z; const {y} = {z} = {};


  36 passing (124ms)

Done in 2.84s.
```
