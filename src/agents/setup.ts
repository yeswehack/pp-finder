import { PPFAgent, PPFConfig, PPFLogger } from "../types";
declare function getBuiltin<T>(module: string): T;

export default (config: PPFConfig, agent: PPFAgent) => {
  const process = getBuiltin<typeof import("process")>("process");
  const Module = getBuiltin<typeof import("module")>("module");
  const require = Module.createRequire(process.cwd());
  const { compile } = require(`${config.root}/compiler.js`) as typeof import("../compiler");
  const logger = agent(config);
  const logged = new Set<string>();

  const pollutables = config.pollutables.map((p) => eval(p));

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
    if (!target || key === "__proto__" || (typeof key === "string" && key.startsWith("#"))) {
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

  const maybeLog: PPFLogger = (opts) => {
    const canonical = `${opts.op} ${opts.key} ${opts.path} ${opts.pos}`;
    if (config.logOnce && logged.has(canonical)) {
      return;
    }
    logged.add(canonical);
    logger(opts);
  };

  const elemMap = new Map<any, any>();

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
