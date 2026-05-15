# PP-Finder

A prototype pollution gadget finder for JavaScript. PP-Finder instruments your code at runtime to highlight property accesses that could be reached via prototype pollution — helping security researchers identify exploitation candidates quickly.

For example, the following access would be flagged:

```javascript
if (options.exec) child_process.exec(options.exec);
```

> Requires Node.js 20+. Tested on Node.js 26.

## Installation

```shell
npm install -g pp-finder
```

```shell
yarn global add pp-finder
```

## Getting Started

Let's find prototype pollution gadgets in the popular Express library as an example.

**1. Set up a target project:**

```shell
mkdir -p target/express && cd target/express
npm install express
```

**2. Create a minimal application (`index.js`):**

```javascript
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
```

**3. Run it with PP-Finder:**

Using the CLI (recommended):

```shell
pp-finder run -- node index.js
```

Or directly with Node.js:

```shell
node --require pp-finder/register --loader pp-finder --no-warnings index.js
```

**4. Observe the output:**

```
PP  prop   "prepareStackTrace"  node_modules/depd/index.js:384:20
PP  prop   "noDeprecation"      node_modules/depd/index.js:154:15
PP  prop   "NO_DEPRECATION"     node_modules/depd/index.js:159:25
PP  prop   "traceDeprecation"   node_modules/depd/index.js:170:15
PP  prop   "TRACE_DEPRECATION"  node_modules/depd/index.js:175:25
PP  prop   "hasOwnProperty"     node_modules/merge-descriptors/index.js:22:39
PP  prop   "type"               node_modules/debug/src/index.js:6:47
PP  prop   "DEBUG_FD"           node_modules/debug/src/node.js:61:31
PP  prop   "DEBUG"              node_modules/debug/src/node.js:157:22
PP  isIn   "colors"             node_modules/debug/src/node.js:76:22
PP  forIn  "_"                  node_modules/debug/src/debug.js:47:13
```

Send a request to the server (`curl http://localhost:3000`) and more gadgets appear:

```
PP  elem   "filename"          node_modules/ejs/lib/utils.js:167:23
PP  elem   "async"             node_modules/ejs/lib/utils.js:167:23
PP  prop   "scope"             node_modules/ejs/lib/ejs.js:387:20
PP  forIn  "_"                 node_modules/ejs/lib/utils.js:243:17
PP  prop   "openDelimiter"     node_modules/ejs/lib/ejs.js:523:57
PP  prop   "closeDelimiter"    node_modules/ejs/lib/ejs.js:524:59
PP  prop   "delimiter"         node_modules/ejs/lib/ejs.js:525:49
PP  isIn   "ctime"             node_modules/etag/index.js:112:16
PP  elem   "if-modified-since" node_modules/fresh/index.js:35:34
PP  elem   "if-none-match"     node_modules/fresh/index.js:36:30
[...]
```

## How It Works

PP-Finder operates in two phases: **compile time** (source transformation) and **runtime** (property access checks).

### Source transformation

When a JavaScript file is loaded, PP-Finder rewrites its source code using a TypeScript AST transformer before the code executes. Specific patterns — property reads, destructuring, `for…in` loops, etc. — are wrapped with calls to a runtime agent stored at `globalThis.ø`.

For example, a simple property read:

```javascript
// Original
if (options.exec) child_process.exec(options.exec);

// After instrumentation (simplified)
if (globalThis.ø.prop(options, "exec")) child_process.exec(globalThis.ø.prop(options, "exec"));
```

Each instrumented call receives the target object, the key, and the source location so the agent can decide whether to log it.

Two module systems are handled separately:

- **CommonJS** (`require`): PP-Finder patches `Module.prototype._compile`. Every `.js` file loaded via `require()` or as the entry point has its source transformed before Node.js compiles it.
- **ESM** (`import`): PP-Finder registers a `load` hook via `--experimental-loader`. The hook intercepts each ES module before execution and passes its source through the same transformer.

### Runtime checks

The runtime agent (`globalThis.ø`) is what decides whether to emit a log line. It does not log every instrumented call — only those where the accessed property could realistically be reached through prototype pollution.

For each call, it walks the prototype chain of the target object and applies two tests:

1. **The target is pollutable** — `Object.prototype` (or another constructor in `PPF_POLLUTABLES`) must appear somewhere in the chain. Objects created with `Object.create(null)` have no prototype and never trigger.
2. **The key is not an own property** — if the key exists directly on the object, it is already defined and cannot be shadowed by pollution. Only keys missing from the object itself (i.e., would be looked up through the prototype chain) are logged.

```javascript
({}).exec          // ✓ fires  — "exec" is not own, Object.prototype is in chain
({ exec: 1 }).exec // ✗ silent — "exec" is own, no prototype lookup needed
Object.create(null).exec // ✗ silent — no prototype chain at all
```

### HTML compilation

The `pipe` command extends instrumentation to HTML pages. When the input is detected as HTML, PP-Finder:

1. **Parses `<script>` tags** — only inline scripts are instrumented; external scripts (`src="..."`) are left untouched.
2. **Skips non-JS script types** — `type="text/template"`, `type="application/json"`, etc. are passed through verbatim. `type="module"` is treated as JavaScript.
3. **Injects the browser agent** — a `<script data-ppf="agent">` block is inserted right after the `<head>` opening tag (or before the first `<script>` if there is no `<head>`). This initializes `globalThis.ø` before any instrumented code runs.

```html
<!-- Original -->
<head></head>
<body>
  <script>if (options.exec) spawn(options.exec);</script>
</body>

<!-- After instrumentation (simplified) -->
<head>
  <script data-ppf="agent">if (!globalThis.ø) globalThis.ø = (browserAgent)(config, createLogger, "");</script>
</head>
<body>
  <script>if (globalThis.ø.prop(options, "exec")) spawn(globalThis.ø.prop(options, "exec"));</script>
</body>
```

The browser agent uses `console.log` with DevTools `%c` CSS styling and extracts source locations from `Error().stack` using the pattern `/(http[^ (]+?):\d+:\d+/`, so logged paths are real HTTP URLs as seen in the browser.

### Startup sequence

When you run `pp-finder run -- node app.js`, the following `NODE_OPTIONS` are set for the child process:

```
--require pp-finder/register   → main thread: sets up globalThis.ø, patches Module.prototype._compile
--experimental-loader pp-finder → hooks thread: registers the ESM load hook
```

`register` runs first (before the loader is even loaded), which is why pp-finder's own dist files are explicitly excluded from instrumentation — otherwise the bundled TypeScript compiler inside `loader.cjs` would instrument itself.

## CLI Reference

```
pp-finder <subcommand>

Subcommands:
  init     Create a pp-finder.json configuration file in the current directory
  compile  Compile a specified file
  run      Run a command with PP-Finder instrumentation
           Example: pp-finder run -c ./pp-finder.json -- node test.js
  pipe     Instrument JS/HTML from stdin and write to stdout (for Burp Piper)
           Example: pp-finder pipe --content-type "text/html" --url "http://example.com/"

Options:
  -c, --config        Path to configuration file (default: ./pp-finder.json)
  -l, --loader        Loader to use (default: pp-finder)
  -t, --type          Force pipe input type: "html" or "js"
      --content-type  Content-Type header value (used for type detection)
      --url           URL of the resource (used for type detection and shown in logs)
```

## Configuration

### File-based configuration

Generate a default configuration file with:

```shell
pp-finder init
```

### Environment variables

All options can also be set via environment variables, which take precedence over the config file:

| Variable           | Type           | Default  | Description                                                  |
| :----------------- | :------------- | :------- | :----------------------------------------------------------- |
| `PPF_WRAPPER_NAME` | string         | `ø`      | Name of the runtime wrapper injected into instrumented code  |
| `PPF_LOGONCE`      | bool           | `false`  | Log each unique finding only once                            |
| `PPF_COLOR`        | bool           | `true`   | Colorize output                                              |
| `PPF_LAZYSTART`    | bool           | `false`  | Wait for `"pp-finder start"` before logging (see Lazy Start) |
| `PPF_POLLUTABLES`  | string (csv)   | `Object` | Comma-separated list of pollutable constructor names         |
| `PPF_AGENT`        | enum           | `node`   | Agent to use for compilation: `node`, `browser`, or `loader` |
| `PPF_TRANSFORMERS` | string (csv)   | *(all)*  | Comma-separated list of transformers to enable               |
| `PPF_SKIP`         | string (regex) | *(none)* | Skip files whose path matches this regex (loader mode only)  |

### Config-file-only options

These options can only be set in the JSON config file (not via environment variables):

| Field          | Type                      | Default | Description                                                    |
| :------------- | :------------------------ | :------ | :------------------------------------------------------------- |
| `extensionMap` | `{ [ext: string]: "html" \| "js" }` | `{}` | Override pipe type detection for specific file extensions (e.g. `{ ".asp": "html" }`) |

### Transformers

Transformers define which JavaScript patterns are instrumented. Each transformer adds runtime checks around a specific syntax form and emits a tagged log line when a potentially pollutable access is reached.

| Transformer                                   | Tag         | Pattern                        | Description                                            |
| :-------------------------------------------- | :---------- | :----------------------------- | :----------------------------------------------------- |
| [`propertyAccess`](#propertyaccess)           | `[prop]`    | `x.y`                          | Dot-notation property read                             |
| [`elementAccess`](#elementaccess)             | `[elem]`    | `x[y]`                         | Bracket-notation property read                         |
| [`variableDeclaration`](#variabledeclaration) | `[bind]`    | `const { k } = x`              | Destructuring variable declaration                     |
| [`objectLiteral`](#objectliteral)             | `[bind]`    | `({ k } = x)`                  | Destructuring assignment expression                    |
| [`arrowFunction`](#arrowfunction)             | `[bind]`    | `({ k }) => …`                 | Destructuring arrow function parameter                 |
| [`functionDeclaration`](#functiondeclaration) | `[bind]`    | `function f({ k }) {}`         | Destructuring named function parameter                 |
| [`functionExpression`](#functionexpression)   | `[bind]`    | `const f = function({ k }) {}` | Destructuring function expression parameter            |
| [`forInStatement`](#forinstatement)           | `[forIn]`   | `for (k in x)`                 | `for…in` loop over a pollutable object                 |
| [`inExpression`](#inexpression)               | `[isIn]`    | `k in x`                       | `in` operator on a pollutable object                   |
| [`expressionStatement`](#expressionstatement) | *(control)* | `"pp-finder start/stop"`       | Enable/disable logging (see [Lazy Start](#lazy-start)) |

To enable only a subset, set `PPF_TRANSFORMERS` to a comma-separated list of transformer names:

```shell
PPF_TRANSFORMERS=forInStatement,elementAccess pp-finder run -- node index.js
```

---

#### `propertyAccess`

**Tag:** `[prop]` &nbsp; **Pattern:** `x.y`

Instruments dot-notation property reads. Fires when `y` is not an own property of `x`, meaning it could be reached through the prototype chain.

```javascript
({}).y;           // triggers — "y" is not on the object
({ y: 42 }).y;    // does NOT trigger — "y" exists directly on the object
```

```
PP  prop   "y"  index.js:1:4
```

---

#### `elementAccess`

**Tag:** `[elem]` &nbsp; **Pattern:** `x[y]`

Instruments bracket-notation property reads. Same semantics as `propertyAccess` but for computed keys.

```javascript
({})["y"];           // triggers
({ y: 42 })["y"];   // does NOT trigger — "y" exists directly on the object
```

```
PP  elem   "y"  index.js:1:4
```

---

#### `variableDeclaration`

**Tag:** `[bind]` &nbsp; **Pattern:** `const { k } = x`

Instruments destructuring in variable declarations. Reports each key read from the right-hand side, including nested paths.

```javascript
const { a } = {};
const { y: { d } } = { y: {} };
```

```
PP  bind   "a"    index.js:1:15
PP  bind   "y.d"  index.js:2:5
```

---

#### `objectLiteral`

**Tag:** `[bind]` &nbsp; **Pattern:** `({ k } = x)`

Instruments destructuring in assignment expressions (outside of a variable declaration). Reports the same way as `variableDeclaration`.

```javascript
({ y } = {});
({ y: { z } } = { y: {} });
```

```
PP  bind   "y"    index.js:1:10
PP  bind   "y.z"  index.js:2:5
```

---

#### `arrowFunction`

**Tag:** `[bind]` &nbsp; **Pattern:** `({ k }) => …`

Instruments destructuring parameters in arrow functions. Fires on each call with the keys read from the argument.

```javascript
(({ y }) => 0)({});
(({ y: z }) => 0)({});   // reports the source key "y", not the alias "z"
```

```
PP  bind   "y"  index.js:1:3
PP  bind   "y"  index.js:2:3
```

---

#### `functionDeclaration`

**Tag:** `[bind]` &nbsp; **Pattern:** `function f({ k }) {}`

Instruments destructuring parameters in named function declarations. Fires on each call.

```javascript
function f({ y }, a, { z }) {}
f({}, 0, {});
```

```
PP  bind   "y"  index.js:1:13
PP  bind   "z"  index.js:1:23
```

---

#### `functionExpression`

**Tag:** `[bind]` &nbsp; **Pattern:** `const f = function({ k }) {}`

Instruments destructuring parameters in function expressions. Same semantics as `functionDeclaration`.

```javascript
const f = function({ y }) {};
f({});
```

```
PP  bind   "y"  index.js:1:20
```

---

#### `forInStatement`

**Tag:** `[forIn]` &nbsp; **Pattern:** `for (k in x)`

Instruments `for…in` loops. Fires when iterating over an object that has prototype-chain properties, since `for…in` enumerates inherited enumerable keys.

```javascript
for (let k in {}) {}                 // triggers — {} inherits from Object.prototype
for (let k in Object.create(null)) {} // does NOT trigger — null prototype, nothing inherited
```

```
PP  forIn  "_"  index.js:1:14
```

> The key shown is always `_` — it indicates the loop target is pollutable, not a specific key name.

---

#### `inExpression`

**Tag:** `[isIn]` &nbsp; **Pattern:** `k in x`

Instruments the `in` operator. Fires when the key is not an own property of the object, meaning the lookup would traverse the prototype chain.

```javascript
"y" in {};          // triggers — "y" is not on the object
"y" in { y: 42 };  // does NOT trigger — "y" exists directly
```

```
PP  isIn   "y"  index.js:1:8
```

---

#### `expressionStatement`

**Tag:** *(control)*

Not a gadget detector. Handles the `"pp-finder start"` and `"pp-finder stop"` string literals used to control logging within the instrumented code. See [Lazy Start](#lazy-start).

---

## Advanced Usage

### Lazy Start

By default, PP-Finder logs gadgets from the moment the process starts. If you only care about gadgets reachable after a specific point in the code (e.g., after user input is processed), use lazy start.

Add `"pp-finder start"` as an expression statement at the point where you want logging to begin:

```javascript
const express = require("express");
const app = express();

"pp-finder start"; // Gadgets found before this line are suppressed

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000);
```

You can also pause logging with `"pp-finder stop"`:

```javascript
"pp-finder start";
// ... gadgets logged here ...
"pp-finder stop";
// ... gadgets suppressed here ...
```

> **Note:** `start`/`stop` only control logging. All code is still instrumented regardless. To exclude files from instrumentation entirely, use the `PPF_SKIP` regex option.

Enable lazy start via the config file or environment variable:

```shell
PPF_LAZYSTART=true pp-finder run -- node index.js
```

### Burp Suite / Piper

The `pipe` command reads JS or HTML from stdin, instruments it with the browser agent, and writes the result to stdout. It is designed to work with [Piper](https://portswigger.net/bappstore/e4e0f6c4f0274754917dcb5f4937bb9e), a Burp extension that can pipe HTTP response bodies through external commands on the fly.

#### How it works

Piper's **HTTP Listener** feature intercepts HTTP responses and replaces the body with the stdout of an external command. PP-Finder receives the raw response body on stdin and returns the instrumented version. The browser then executes the instrumented code, and gadgets appear in the DevTools console in real time.

The browser agent extracts the source URL automatically from `Error().stack` — no wrapper script or `--url` flag is needed.

#### Setup

**Prerequisites:** `pp-finder` must be in the PATH of the user running Burp Suite. If you installed it globally (`npm install -g pp-finder` or `npm link`), this is already the case.

**1. Install Piper** from the BApp Store inside Burp Suite (`Extensions → BApp Store → Piper`).

**2. Import the Piper config.** Download [pp-finder.piper.yaml](pp-finder.piper.yaml) from this repository, then in Burp go to `Piper → Import → From file`.

**3. Enable the rules.** Piper disables all rules imported via the GUI by default. Go to `Piper → HTTP Listeners`, check the box next to both rules to enable them.

**4. Browse through Burp Proxy.** Open the browser through Burp's built-in browser (or configure your browser to use Burp as a proxy). Every HTML page and JavaScript file will be instrumented transparently. Open DevTools → Console to see gadget findings as pages load.

#### What to expect

Gadgets appear in the console color-coded by type:

```
PP  prop   "exec"  https://example.com/app.js:42:15
PP  elem   "x-forwarded-for"  https://example.com/page.html:18:3
```

The logged path is the real HTTP URL extracted from the browser's stack trace — it points directly to the file and line where the potentially pollutable access happens.

#### Limitations

- **External scripts** referenced via `<script src="...">` are not instrumented by the HTML rule — they are fetched separately and hit the JS rule independently.
- **Cached responses** served from the browser cache bypass Piper entirely. Use a hard reload (`Ctrl+Shift+R`) or disable caching in DevTools to force all resources through the proxy.
- **Minified code** produces accurate line/column numbers from the original minified source. Source maps are not applied.

## Development

### Build

```shell
make all
```

### Run tests

```shell
make test
```

Tests cover the following AST transformations:

```
arrowFunctionDeclaration, assignation, awaitAssign, classPrivateFields,
elementAccessExpression, eval, forInStatement, functionCall,
functionDeclaration, functionExpression, inExpression, lazyStart,
nullish, objectLiteral, propertyAccessExpression, statefulGetter,
variableDeclaration
```


### Install locally as a global CLI

To use your local checkout as the `pp-finder` command system-wide while iterating on the code:

```shell
make all   # build dist/ first
npm link   # create a global symlink pointing to this directory
```

`npm link` registers a symlink in your global `node_modules` and adds the `pp-finder` binary to your `PATH`. Because it is a symlink, every `make all` rebuild is picked up immediately — no reinstall needed.

To remove it when you are done:

```shell
npm unlink -g pp-finder
```

**Per-project linking with Yarn** — if you want a specific project to resolve `pp-finder` from this repository instead of the registry, add the `portal:` protocol to that project's `package.json`:

```json
{
  "dependencies": {
    "pp-finder": "portal:/path/to/pp-finder"
  }
}
```

Then run `yarn install` in the target project. The `portal:` protocol creates a hard link to the local directory (no copy) so rebuilds are reflected immediately.


