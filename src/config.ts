import fs from "fs";
import { PPFinderConfig, ppFinderConfig } from "./types";

const DEFAULT_PPF_CONFIG_FILE_PATH = "./ppf.config.json";

function readFileConfig() {
  const configPath = process.env.PPF_CONFIG_PATH || DEFAULT_PPF_CONFIG_FILE_PATH;
  if (!fs.existsSync(configPath)) {
    return Object.create(null);
  }
  const content = fs.readFileSync(configPath, "utf8");
  if (!content.trim()) {
    return Object.create(null);
  }

  const config = JSON.parse(content);
  Object.setPrototypeOf(config, null);
  return config;
}

function parseBool(env: string) {
  const s = env.toLowerCase().trim();
  if (["no", "false", "0"].includes(s)) return false;
  return true;
}

function isValidColorOption(
  env: string | undefined
): env is PPFinderConfig["color"] {
  if (!env) return false;
  if (["auto", "always", "never"].includes(env)) return true;
  return false;
}

function loadEnvConfig(config: PPFinderConfig) {
  if (process.env.PPF_LOGONCE) {
    config.logOnce = parseBool(process.env.PPF_LOGONCE);
  }

  if (process.env.PPF_WRAPPER_NAME) {
    config.wrapperName = process.env.PPF_WRAPPER_NAME;
  }
  if (isValidColorOption(process.env.PPF_COLOR)) {
    config.color = process.env.PPF_COLOR;
  }
  if (process.env.PPF_LOG_FORIN) {
    config.log.ForIn = parseBool(process.env.PPF_LOG_FORIN);
  }
  if (process.env.PPF_LOG_ISIN) {
    config.log.IsIn = parseBool(process.env.PPF_LOG_ISIN);
  }
  if (process.env.PPF_LOG_PROP) {
    config.log.Prop = parseBool(process.env.PPF_LOG_PROP);
  }
  if (process.env.PPF_LOG_ELEM) {
    config.log.Elem = parseBool(process.env.PPF_LOG_ELEM);
  }
  if (process.env.PPF_LOG_BIND) {
    config.log.Bind = parseBool(process.env.PPF_LOG_BIND);
  }
  if (process.env.PPF_LOGFILE) {
    config.logFile = process.env.PPF_LOGFILE;
  }
  if (process.env.PPF_POLLUTABLE) {
    config.pollutable = process.env.PPF_POLLUTABLE.split(",");
  }
  if (process.env.PPF_BROWSER) {
    config.browser = parseBool(process.env.PPF_BROWSER);
  }
  return config;
}

export function loadConfig() {
  const fileConfig = readFileConfig();
  const config = loadEnvConfig(ppFinderConfig.parse(fileConfig));
  return config;
}
