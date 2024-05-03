/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import { defineAgent } from "./utils";
declare function getBuiltin<T>(module: string): T;

export default defineAgent((config, utils, root: string) => {
  const process = getBuiltin<typeof import("process")>("process");
  const Module = getBuiltin<typeof import("module")>("module");
  const pollutables = config.pollutables.map((p) => eval(p));
  const elemMap = new Map<any, any>();
  const require = Module.createRequire(process.cwd());

  const getPath = utils.createGetPath(/([^ (]+?):\d+:\d+/, 3);
  const canBePolluted = utils.createCanBePolluted(pollutables);

  const { compile } =
    require(`${root}/compiler.js`) as typeof import("../compiler");

  function processHookRequire() {
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

    Module.prototype.require = Object.assign(
      ppfRequire,
      Module.prototype.require
    );
  }
  processHookRequire();

  const log = utils.createLog<{
    op: string;
    key?: string;
    path: string;
    pos: [number, number];
  }>(config, ({ op, key, path, pos }) => {
    const shortPath = path.replace(process.cwd(), ".");
    const loc = `${pos[0]}:${pos[1]}`;

    if (key) {
      console.log(`[PP][${op}] ${key} at ${shortPath}:${loc}`);
    } else {
      console.log(`[PP][${op}] at ${path}:${loc}`);
    }
  });

  return {
    prop(pos, target, key) {
      if (canBePolluted(target, key)) {
        log.maybeLog({
          op: "prop",
          path: getPath(),
          pos,
          key: String(key),
        });
      }
      return target;
    },
    call(pos, target, ...args) {
      let needLog = false;
      if (target?.name === "Function" || target?.name === "bound Function") {
        args[args.length - 1] = compile(config, args[args.length - 1]);
        needLog = true;
      } else if (target?.name === "eval" || target?.name === "bound eval") {
        args[0] = compile(config, args[0]);
        needLog = true;
      }

      if (needLog) {
        log.maybeLog({
          op: "call",
          path: getPath(),
          key: target?.name.replace(/^bound /, ""),
          pos,
        });
      }

      return target?.(...args);
    },
    elemProp(pos, id, target) {
      elemMap.set(id, target);
      return target;
    },

    elemKey(pos, id, key) {
      const target = elemMap.get(id);
      elemMap.delete(id);
      if (canBePolluted(target, key)) {
        log.maybeLog({
          op: "elem",
          path: getPath(),
          pos,
          key: String(key),
        });
      }
      return key;
    },
    start() {
      log.start();
    },
    stop() {
      log.stop();
    },
    forIn(pos, target) {
      if (canBePolluted(target)) {
        log.maybeLog({
          op: "forIn",
          path: getPath(),
          pos,
        });
      }
      return target;
    },
    isIn(pos, target, key) {
      if (canBePolluted(target, key)) {
        log.maybeLog({
          op: "isIn",
          path: getPath(),
          pos,
          key: String(key),
        });
      }
      return key in target;
    },
    bind(pos, target, keyList) {
      for (const keys of keyList) {
        let t = target;
        const path = [];
        for (const key of keys) {
          if (canBePolluted(t, key)) {
            path.push(key);
            log.maybeLog({
              op: "bind",
              path: getPath(),
              pos,
              key: path.join("."),
            });
            break;
          } else {
            path.push(key);
          }
        }
      }
      return target;
    },
  };

  /*

  */
});
