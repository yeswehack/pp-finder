const configFileName = "pp-config.json";

const getBoolFromEnv = (key) => {
  try {
    if (process.env[key] == null) {
      return false;
    }

    return process.env[key] !== "false";
  } catch (e) {
    return false;
  }
};

const getStringFromEnv = (key) => {
  try {
    if (process.env[key] == null || process.env[key] === "") {
      return void 0;
    }

    return process.env[key];
  } catch (e) {
    return void 0;
  }
};

const defaultArgs = {
  onlyNewOnes: false,
  noColor: false,
  outputFile: null,
};

const optionsFromFile = (() => {
  try {
    const fs = require("fs");
    const path = require("path");

    const configPath = path.join(__dirname, "..", "..", configFileName);
    const data = fs.readFileSync(configPath, "utf-8");
    const fromFile = JSON.parse(data);

    return fromFile;
  } catch (e) {
    return {};
  }
})();

const optionsFromEnvironment = {
  onlyNewOnes: getBoolFromEnv("PPF_LOG_ONCE"),
  noColor: getBoolFromEnv("PPF_NO_COLOR"),
  outputFile: getStringFromEnv("PPF_OUTPUT_FILE"),
};

const getOptionValue = (key) =>
  optionsFromEnvironment[key] ?? optionsFromFile[key] ?? defaultArgs[key];

const options = {
  onlyNewOnes: getOptionValue("onlyNewOnes"),
  noColor: getOptionValue("noColor"),
  outputFile: getOptionValue("outputFile"),
};

const writeLogMessageToFile = (msg) => {
  try {
    const fs = require("fs");
    const os = require("os");

    const fd = fs.openSync(options.outputFile, "a", parseInt("0664", 8));
    fs.writeSync(fd, msg + os.EOL, null, "utf-8");
  } catch (e) {
    console.error(`Could not write message to file: ${e}`);
  }
};

// Remove outputFile to keep it clean for one run
if (options.outputFile) {
  try {
    const fs = require("fs");
    fs.unlinkSync(options.outputFile);
  } catch (e) {
    console.error(`Could not unlink file ${options.outputFile}: ${e}`);
  }
}








const ppFinder = (filename) => {
  const logged = [];

  function logger(expressionType, location, key) {
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
    if (options.noColor) {
      c = (_color, msg) => `${msg}`;
    }

    const fullLoc = `${filename}:${location[0]}:${location[1]}`;
    const keyStr = key ? ` ${key}` : "";
    const msg =
      `[${c("PP", "PP")}]` +
      `[${c(expressionType, expressionType + keyStr)}]` +
      ` ${fullLoc}`;
    // if --only-new-ones is specified and the msg is already in the set, return immediately and don't log
    if (options.onlyNewOnes && logged.includes(msg)) return;
    if (options.outputFile) writeLogMessageToFile(msg);
    console.log(msg);
    // Keep track of what's being logged to handle --only-new-ones
    logged.push(msg);
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
      logger("Prop", location, key);
    }
    return target;
  }

  function ElementAccessExpression(target, key, location) {
    const r = (k) => {
      try {
        return JSON.stringify(k);
      } catch  {
        return Object.toString.call(k);
      }
    };
    if (canBePolluted(target, key)) {
      logger("Elem", location, r(key));
    }
   /*  if (typeof target[key] === "function"  && key != "Promise") {
      return target[key].bind(target);
    } */

    return target[key];
  }

  function ForInStatement(target, location) {
    if (target && target.__proto__ === {}.__proto__) {
      logger("ForIn", location);
    }
    return target;
  }

  function BinaryExpressionIn(target, key, location) {
    if (canBePolluted(target, key) && key !== void 0) {
      logger("IsIn", location, `"${key.toString()}"`);
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
          logger("Bind", location, [...path, key].join("."));
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
