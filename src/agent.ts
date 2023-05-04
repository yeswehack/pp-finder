/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import type _fs from "fs";
import type _module from "module";
import type _os from "os";
import type _path from "path";
import type _process from "process";
import type _tty from "tty";
import type _util from "util";
import type { ExpressionType, Location, PPFinderConfig } from "./types";

declare function getBuiltin<T>(module: string): T;

export default function (root: string, config: PPFinderConfig) {
  const fs = getBuiltin<typeof _fs>("fs");
  const os = getBuiltin<typeof _os>("os");
  const tty = getBuiltin<typeof _tty>("tty");
  const path = getBuiltin<typeof _path>("path");
  const Module = getBuiltin<typeof _module>("module");
  const process = getBuiltin<typeof _process>("process");

  const fd = config.logFile ? fs.openSync(config.logFile, "w") : null;
  const useColor = tty.isatty(fd ?? 1)
    ? config.color != "never"
    : config.color == "always";
  const pollutable = new Set(config.pollutable.map((p) => eval(p)));

  function canBePolluted(target: any, key?: PropertyKey) {
    if (
      target === undefined ||
      target === null ||
      key === "__proto__" ||
      typeof key === "symbol"
    ) {
      return false;
    }

    let obj = target;
    do {
      if (key !== undefined && Object.hasOwnProperty.call(obj, key)) {
        return false;
      }

      if (pollutable.has(obj.__proto__)) {
        return true;
      }
      obj = Object.getPrototypeOf(obj);
    } while (obj);
    return false;
  }

  const require = Module.createRequire(process.cwd());
  const {
    compile,
  } = require(`${root}/compiler.js`);

  const _require = Module.prototype.require;
  const _wrap = Module.wrap;

  // Modify the require function to compile the module before loading it
  const ppfRequire = function (this: _module, id: string) {
    if (Module.builtinModules.includes(id)) {
      return _require.apply(this, [id]);
    }
    const relativePath = path.relative(process.cwd(), path.join(this.path, id));
    Module.wrap = function (script: string) {
      return _wrap(compile(config.wrapperName, relativePath, script));
    };
    return _require.apply(this, [id]);
  };

  Module.wrap = function (script: string) {
    return _wrap(compile(config.wrapperName, process.argv[1], script));
  };

  Module.prototype.require = Object.assign(
    ppfRequire,
    Module.prototype.require
  );

  /* #region LOGGING */
  const colorMap = {
    reset: "\x1b[0m",
    PP: "\x1b[34m",
    Internal: "\x1b[31m",
    Bind: "\x1b[35m",
    Elem: "\x1b[32m",
    ForIn: "\x1b[31m",
    IsIn: "\x1b[33m",
    Prop: "\x1b[36m",
  } as const;

  const format = (color: keyof typeof colorMap, text: string, wraps = "") => {
    const prefix = wraps.length == 2 ? wraps[0] : "";
    const suffix = wraps.length == 2 ? wraps[1] : "";
    if (!useColor) return `${prefix}${text}${suffix}`;
    return `${prefix}${colorMap[color]}${text}${colorMap.reset}${suffix}`;
  };

  const log = (...msg: string[]) => {
    const txt = `${format("PP", "PP", "[]")}${msg.join(" ")}`;
    if (fd) {
      fs.writeSync(fd, `${txt}${os.EOL}`);
    } else {
      console.log(txt);
    }
  };

  const logged = new Set<string>();
  const logGadget = (
    expressionType: ExpressionType | "Internal",
    filename: string,
    location?: Location,
    key?: string
  ) => {
    if (!config.log[expressionType]) return;

    const fullLoc = location
      ? `${filename}:${location[0]}:${location[1]}`
      : filename;
    const gadget = expressionType + (key ? ` ${key}` : "");

    const msg = `${format(expressionType, gadget, "[]")} ${fullLoc}`;
    if (config.logOnce && logged.has(msg)) return;
    logged.add(msg);
    log(msg);
  };

  /* #endregion */

  return (filename: string) => {
    return {
      prop(target: any, key: PropertyKey, loc: Location) {
        if (canBePolluted(target, key)) {
          logGadget("Prop", filename, loc, key.toString());
        }
        return target;
      },
      elem(target: any, key: PropertyKey, loc: Location) {
        if (canBePolluted(target, key)) {
          logGadget("Elem", filename, loc, key.toString());
        }
        return (target as any)[key];
      },
      forIn(target: any, loc: Location) {
        if (canBePolluted(target)) {
          logGadget("ForIn", filename, loc);
        }
        return target;
      },
      isIn(target: any, key: PropertyKey, loc: Location) {
        if (canBePolluted(target, key) && key !== void 0) {
          logGadget("IsIn", filename, loc, key.toString());
        }
        return key in target;
      },
      bind(target: any, keyList: PropertyKey[][], loc: Location) {
        for (const keys of keyList) {
          let t = target;
          const path = [];
          for (const key of keys) {
            if (canBePolluted(t, key)) {
              logGadget("Bind", filename, loc, [...path, key].join("."));
              break;
            } else {
              t = target[key];
              path.push(key);
            }
          }
        }
        return target;
      },
    };
  };
}
