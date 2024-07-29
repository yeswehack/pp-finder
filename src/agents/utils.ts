import { PPFConfig } from "../config";
import { PPFOps } from "../types";

type PPFAgent<TArgs extends any[]> = (
  config: PPFConfig,
  utils: typeof createLogger,
  ...args: TArgs
) => PPFOps;
export function defineAgent<TArgs extends any[] = unknown[]>(
  f: PPFAgent<TArgs>
) {
  return f;
}

export interface PFFFormat {
  op: string;
  key?: string;
  path: string;
  pos: [number, number];
}

/**
 * WARNING !
 * This function is used as a string by the loader, all the code must be inside
 * and must not have any dependencies
 */
export const createLogger = (
  config: PPFConfig,
  extractPath: {
    regex: RegExp;
    depth: number;
  },
  format: (args: PFFFormat) => string[]
): PPFOps => {
  let started = !config.lazyStart;
  const logged = new Set<string>();
  function maybeLog(arg: PFFFormat) {
    if (!started) {
      return;
    }
    if (config.logOnce) {
      const canonical = JSON.stringify(arg);
      if (logged.has(canonical)) {
        return;
      }
      logged.add(canonical);
    }

    console.log(...format(arg));
  }

  const pollutables = config.pollutables.map((p) => eval(p));
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
  function getPath() {
    const stack = new Error().stack as string;
    const line = stack.split("\n")[extractPath.depth];
    let match;
    if ((match = line?.match(extractPath.regex))) {
      return match[1]!;
    }
    return "unknown";
  }

  const elemMap = new Map<any, any>();
  return {
    prop(pos, target, key) {
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
    call(pos, target, ...args) {
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
        maybeLog({
          op: "elem",
          path: getPath(),
          pos,
          key: String(key),
        });
      }
      return key;
    },
    start() {
      started = true;
    },
    stop() {
      started = false;
    },
    forIn(pos, target) {
      if (canBePolluted(target)) {
        maybeLog({
          op: "forIn",
          path: getPath(),
          pos,
        });
      }
      return target;
    },
    isIn(pos, target, key) {
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
    bind(pos, target, keyList) {
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

export default createLogger;
