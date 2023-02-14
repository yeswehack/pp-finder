const ppFinder = (filename) => {
  function acquire_logger() {
    if (typeof console !== "undefined") {
      return console.log;
    } else {
      if (typeof require !== "undefined") {
        const { log } = require("internal/console/global");
        return log;
      }

      // What if none is available ?
    }
  }

  function ppLogger(expressionType, location, key) {
    const log = acquire_logger();
    if (!log) return;

    // log({ expressionType, location, key });

    const colorMap = {
      reset: "\x1b[0m",
      PP: "\x1b[34m",
      ForIn: "\x1b[31m",
      Elem: "\x1b[32m",
      IsIn: "\x1b[33m",
      Bind: "\x1b[35m",
      Prop: "\x1b[36m",
    };
    let c = (color, msg) => `${colorMap[color]}${msg}${colorMap["reset"]}`;

    const fullLoc = `${filename}:${location[0]}:${location[1]}`;
    const keyStr = key ? ` ${key}` : "";
    const msg =
      `[${c("PP", "PP")}]` +
      `[${c(expressionType, expressionType + keyStr)}]` +
      ` ${fullLoc}`;

    try {
      log(msg);
    } catch (e) { }
  }

  function canBePolluted(target, key) {
    if (target === undefined || target === null) {
      return false;
    }
    let proto = target;
    while (proto.__proto__) {
      proto = proto.__proto__;
    }
    if (!(proto === {}.__proto__)) {
      return false;
    }

    if (Object.hasOwnProperty.call(target, key)) {
      return false;
    }
    if (typeof key === "symbol") {
      return false;
    }

    return target[key] === undefined;
  }

  function PropertyAccessExpression(target, key, location) {
    if (canBePolluted(target, key)) {
      ppLogger("Prop", location, key);
    }
    return target;
  }

  function ElementAccessExpression(target, key, location) {
    const r = (k) => {
      try {
        return JSON.stringify(k);
      } catch (_a) {
        return Object.toString.call(k);
      }
    };
    if (canBePolluted(target, key)) {
      ppLogger("Elem", location, r(key));
    }
    return key;
  }

  function ForInStatement(target, location) {
    if (target && target.__proto__ === {}.__proto__) {
      ppLogger("ForIn", location);
    }
    return target;
  }

  function BinaryExpressionIn(target, key, location) {
    if (canBePolluted(target, key) && key !== void 0) {
      ppLogger("IsIn", location, `"${key.toString()}"`);
    }
    return key in target;
  }

  function BindingPattern(target, keysList, location) {
    const getTarget = (target, keys) => {
      if (
        target !== null &&
        target !== undefined &&
        keys.length &&
        keys[0] in target
      ) {
        return getTarget(target[keys[0]], keys.slice(1));
      } else {
        return target;
      }
    };
    for (const keys of keysList) {
      let t = target;
      const path = [];
      for (const key of keys) {
        if (canBePolluted(t, key)) {
          ppLogger("Bind", location, [...path, key].join("."));
          break;
        } else {
          t = target[key];
          path.push(key);
        }
      }
    }
    return target;
  }

  return {
    prop: PropertyAccessExpression,
    elem: ElementAccessExpression,
    forIn: ForInStatement,
    isIn: BinaryExpressionIn,
    bind: BindingPattern,
  };
};

exports.ppFinder = ppFinder;
