/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import { createLogger, defineAgent } from "./utils";
declare function getBuiltin<T>(module: string): T;

export default defineAgent((config, createLogger, root: string) => {
  const process = getBuiltin<typeof import("process")>("process");
  const Module = getBuiltin<typeof import("module")>("module");
  const Path = getBuiltin<typeof import("path")>("path");
  const require = Module.createRequire(process.cwd());

  const { compile } =
    require(`${root}/compiler.js`) as typeof import("../compiler");

  const skipRegex = config.skip && new RegExp(config.skip);

  function processHookRequire() {
    // Use _compile (which receives the filename) instead of Module.wrap (which
    // doesn't), so we can exclude pp-finder's own dist files. This prevents
    // loader.cjs from being instrumented when --require runs before --loader
    // in Node 22+ startup ordering.
    const _compile = (Module.prototype as any)._compile;
    const rootDir = root + Path.sep;

    (Module.prototype as any)._compile = function (
      content: string,
      filename: string
    ) {
      if (!filename.startsWith(rootDir) && (!skipRegex || !skipRegex.test(filename))) {
        content = compile(config, content);
      }
      return _compile.call(this, content, filename);
    };
  }
  processHookRequire();

  const colorMap: Record<string, string> = {
    reset: "\x1b[0m",
    PP: "\x1b[1;34m",
    bind: "\x1b[35m",
    elem: "\x1b[32m",
    forIn: "\x1b[31m",
    isIn: "\x1b[33m",
    prop: "\x1b[36m",
    key: "\x1b[0;33m",
  } as const;

  const format = (color: keyof typeof colorMap, text: string) => {
    if (!config.color) return text;
    return `${colorMap[color]}${text}${colorMap.reset}`;
  };

  return createLogger(
    config,
    {
      regex: /([^ (]+?):\d+:\d+/,
      depth: 3,
    },
    ({ op, key, path, pos }) => {
      const shortPath = Path.relative(process.cwd(), path);
      const loc = `${pos[0]}:${pos[1]}`;
      return [`${format("PP", "PP")}  ${format(op, op.padEnd(5))}  ${format("key", JSON.stringify(key || "_"))}  ${shortPath}:${loc}`];
    }
  );
});
