/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import { PPFConfig } from "../config";

export type PPFAgentUtils = ReturnType<typeof createUtils>;
const createUtils = () => {
  return {
    createGetPath(regex: RegExp, depth: number) {
      return () => {
        const stack = new Error().stack as string;
        //console.log(stack)
        const line = stack.split("\n")[depth];
        let match;
        if ((match = line?.match(regex))) {
          return match[1]!;
        }
        return "unknown";
      };
    },
    createCanBePolluted(pollutables: any[]) {
      return (target: any, key?: PropertyKey) => {
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
      };
    },
    createLog<T>(config: PPFConfig, f: (arg: T) => void) {
      let started = !config.lazyStart;
      const logged = new Set<string>();
      return {
        start() {
          started = true;
        },
        stop() {
          started = false;
        },
        maybeLog(arg: T) {
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

          f(arg);
        },
      };
    },
  };
};

export default createUtils;
