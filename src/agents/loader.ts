/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import { PPFAgent } from "../types";
declare function getBuiltin<T>(module: string): T;

const agent: PPFAgent = (config) => {
  const process = getBuiltin<typeof import("process")>("process");
  const Module = getBuiltin<typeof import("module")>("module");

  function processHookRequire() {
    const require = Module.createRequire(process.cwd());
    const { compile } = require(`${config.root}/compiler.js`) as typeof import("../compiler");

    const _require = Module.prototype.require;
    const _wrap = Module.wrap;

    // Modify the require function to compile the module before loading it
    const ppfRequire = function (this: typeof Module, id: string) {
      if (Module.builtinModules.includes(id)) {
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

    Module.prototype.require = Object.assign(ppfRequire, Module.prototype.require);
  }

  processHookRequire();

  return ({ op, key, path, pos }) => {
    const shortPath = path.replace(process.cwd(), ".");
    const loc = `${pos[0]}:${pos[1]}`;
    if (key) {
      console.log(`[PP][${op}] ${key} at ${shortPath}:${loc}`);
    } else {
      console.log(`[PP][${op}] at ${path}:${loc}`);
    }
  };
};

export default agent;
