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
    const _require = Module.prototype.require;
    const _wrap = Module.wrap;

    // Modify the require function to compile the module before loading it
    const ppfRequire = function (this: typeof Module, id: string) {
      if (
        Module.builtinModules.includes(id) ||
        (skipRegex && skipRegex.test(id))
      ) {
        return _require.apply(this, [id]);
      }

      Module.wrap = function (script: string) {
        return _wrap(compile(config, script));
      };
      return _require.apply(this, [id]);
    };

    Module.wrap = function (script: string) {
      return _wrap(compile(config, script));
    };

    Module.prototype.require = Object.assign(
      ppfRequire,
      Module.prototype.require
    );
  }
  processHookRequire();

  const colorMap: Record<string, string> = {
    reset: "\x1b[0m",
    PP: "\x1b[34m",
    bind: "\x1b[35m",
    elem: "\x1b[32m",
    forIn: "\x1b[31m",
    isIn: "\x1b[33m",
    prop: "\x1b[36m",
    key: "\x1b[0;33m",
  } as const;

  const format = (color: keyof typeof colorMap, text: string, wraps = "") => {
    const prefix = wraps.length == 2 ? wraps[0] : "";
    const suffix = wraps.length == 2 ? wraps[1] : "";

    if (config.color === "never") {
      return `${prefix}${text}${suffix}`;
    }

    return `${prefix}${colorMap[color]}${text}${colorMap.reset}${suffix}`;
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
      return [`${format("PP", "PP", "[]")}${format(op, op, "[]")} ${format(
        "key",
        JSON.stringify(key || "_")
      )} at ${shortPath}:${loc}`];
    }
  );
});
