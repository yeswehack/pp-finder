/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import { PPFConfig, PPFLogger } from "../types";

const agent = (config: PPFConfig, compilerImportPath?: string) => {
  const { compile } = require(compilerImportPath ?? 'pp-finder/dist/compiler.js');
  const pollutables = config.pollutables.map((p) => eval(p));
  const elemMap = new Map<any, any>();

  function getPath(): string {
    const stack = new Error().stack as string;
    const line = stack.split("\n")[3];
    let match;
    if ((match = line?.match(/\((.*):\d+:\d+\)/))) {
      return match[1]!;
    }
    if ((match = line?.match(/at (.*):\d+:\d+/))) {
      return match[1]!;
    }
    return "unknown";
  }

  function canBePolluted(target: any, key?: PropertyKey) {
    if (
      !target ||
      key === "__proto__" ||
      (typeof key === "string" && key.startsWith("#"))
    ) {
      return false;
    }

    for (let obj = target; obj; obj = Object.getPrototypeOf(obj)) {
      if (pollutables.some((p) => p.prototype === obj)) {
        return true;
      }
      if (key !== undefined && Object.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return false;
  }

  const logged = new Set<string>();

  const maybeLog: PPFLogger = (opts) => {
    const canonical = `${opts.op} ${opts.key} ${opts.path} ${opts.pos}`;
    if (config.logOnce && logged.has(canonical)) {
      return;
    }
    logged.add(canonical);
    const { op, key, path, pos } = opts;
    const shortPath = path.replace(process.cwd(), ".");
    const loc = `${pos[0]}:${pos[1]}`;
    if (key) {
      console.log(`[PP][${op}] ${key} at ${shortPath}:${loc}`);
    } else {
      console.log(`[PP][${op}] at ${path}:${loc}`);
    }
  }

  return {
    prop(target: any, key: PropertyKey, pos: [number, number]) {
      if (canBePolluted(target, key)) {
        maybeLog({
          op: "prop",
          path: getPath(),
          pos,
          key: String(key),
        });
      }
      return target;
    },
    call(target: any, ...args: any[]) {
      const pos = args.pop();
      let log = false;
      if (target?.name === "Function" || target?.name === "bound Function") {
        args[args.length - 1] = compile(config, args[args.length - 1]);
        log = true;
      } else if (target?.name === "eval" || target?.name === "bound eval") {
        args[0] = compile(config, args[0]);
        log = true;
      }

      if (log) {
        maybeLog({
          op: "call",
          path: getPath(),
          key: target?.name.replace(/^bound /, ""),
          pos,
        });
      }

      return target?.(...args);
    },
    elem_a(target: any, key: string, pos: [number, number]) {
      elemMap.set(key, target);
      return target;
    },

    elem_b(key: any, elemKey: string, pos: [number, number]) {
      const target = elemMap.get(elemKey);
      elemMap.delete(elemKey);
      if (canBePolluted(target, key)) {
        maybeLog({
          op: "elem",
          path: getPath(),
          pos,
          key: String(key),
        });
      }
      return key;
    },
    forIn(target: any, pos: [number, number]) {
      if (canBePolluted(target)) {
        maybeLog({
          op: "forIn",
          path: getPath(),
          pos,
        });
      }
      return target;
    },
    isIn(target: any, key: PropertyKey, pos: [number, number]) {
      if (canBePolluted(target, key)) {
        maybeLog({
          op: "isIn",
          path: getPath(),
          pos,
          key: String(key),
        });
      }
      return key in target;
    },
    bind(target: any, keyList: PropertyKey[][], pos: [number, number]) {
      for (const keys of keyList) {
        let t = target;
        const path = [];
        for (const key of keys) {
          if (canBePolluted(t, key)) {
            path.push(key);
            maybeLog({
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
};

export default agent;
