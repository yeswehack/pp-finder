import { z } from "zod";
import { existsSync, readFileSync } from "fs";

type DeepPartial<T> = {
  [L in keyof T]?: T[L] extends any[]
    ? T[L]
    : T[L] extends object
    ? DeepPartial<T[L]>
    : T[L];
};

type PPFPartialConfig = DeepPartial<PPFConfig>;

const colorModeParser = z.enum(["auto", "always", "never"]);
const agentParser = z.enum(["loader", "node", "browser"]);

export const jsonParser = z
  .object({
    logOnce: z
      .boolean()
      .default(false)
      .describe("Whether to log each gadget once or not"),
    wrapperName: z.string().default("ø").describe("Wrapper name"),
    color: colorModeParser
      .default("auto")
      .describe("Whether to colorize the output or not"),
    lazyStart: z
      .boolean()
      .default(false)
      .describe('Whether to wait for "pp-finder start" or not'),
    log: z
      .object({
        ForIn: z.boolean().default(true).describe("Log `for (y in x)` gadgets"),
        IsIn: z.boolean().default(true).describe("Log `y in x` gadgets"),
        Prop: z.boolean().default(true).describe("Log `x.y` gadgets"),
        Elem: z.boolean().default(true).describe("Log `x[y]` gadgets"),
        Bind: z.boolean().default(true).describe("Log `{y} = x` gadgets"),
      })
      .default({})
      .describe("Define witch gadgets to log"),
    logFile: z.string().default("").describe("File to log gadgets to"),
    pollutables: z
      .array(z.string())
      .default(["Object"])
      .describe("Pollutable objects"),
    agent: agentParser.default("loader").describe("Agent to use"),
  })
  .default({})
  .describe("PP Finder configuration file");

export type PPFConfig = z.infer<typeof jsonParser>;

const coerceBoolean = z
  .enum(["0", "1", "true", "false"])
  .catch("false")
  .transform((value) => value == "true" || value == "1");

const envParser = z
  .object({
    PPF_WRAPPER_NAME: z.string(),
    PPF_LOGONCE: coerceBoolean,
    PPF_COLOR: colorModeParser,
    PPF_LAZYSTART: coerceBoolean,
    PPF_LOG_FORIN: coerceBoolean,
    PPF_LOG_ISIN: coerceBoolean,
    PPF_LOG_PROP: coerceBoolean,
    PPF_LOG_ELEM: coerceBoolean,
    PPF_LOG_BIND: coerceBoolean,
    PPF_LOGFILE: z.string(),
    PPF_POLLUTABLES: z.string(),
    PPF_AGENT: agentParser,
  })
  .partial()
  .transform(
    (env): PPFPartialConfig => ({
      wrapperName: env.PPF_WRAPPER_NAME,
      logOnce: env.PPF_LOGONCE,
      color: env.PPF_COLOR,
      lazyStart: env.PPF_LAZYSTART,
      log: {
        ForIn: env.PPF_LOG_FORIN,
        IsIn: env.PPF_LOG_ISIN,
        Prop: env.PPF_LOG_PROP,
        Elem: env.PPF_LOG_ELEM,
        Bind: env.PPF_LOG_BIND,
      },
      logFile: env.PPF_LOGFILE,
      pollutables: env.PPF_POLLUTABLES?.split(","),
      agent: env.PPF_AGENT,
    })
  );

function loadFileConfig(filename: string): PPFPartialConfig {
  if (existsSync(filename) === false) {
    return jsonParser.parse({});
  }

  try {
    const content = readFileSync(filename, "utf-8");
    const config = jsonParser.parse(JSON.parse(content));
    return config;
  } catch (e) {
    console.error(`Error loading config from ${filename}: ${e}`);
    return jsonParser.parse({});
  }
}

function mergeConfigs(...configs: PPFPartialConfig[]): PPFConfig {
  return configs.reduce<PPFConfig>((acc, config) => {
    return {
      agent: config.agent ?? acc.agent,
      color: config.color ?? acc.color,
      lazyStart: config.lazyStart ?? acc.lazyStart,
      log: {
        ForIn: config.log?.ForIn ?? acc.log.ForIn,
        IsIn: config.log?.IsIn ?? acc.log.IsIn,
        Prop: config.log?.Prop ?? acc.log.Prop,
        Elem: config.log?.Elem ?? acc.log.Elem,
        Bind: config.log?.Bind ?? acc.log.Bind,
      },
      logFile: config.logFile ?? acc.logFile,
      logOnce: config.logOnce ?? acc.logOnce,
      pollutables: config.pollutables ?? acc.pollutables,
      wrapperName: config.wrapperName ?? acc.wrapperName,
    };
  }, defaultConfig);
}

export const defaultConfig: PPFConfig = jsonParser.parse({});
export function loadConfig() {
  const filename = process.env.PPF_CONFIG_FILE || "pp-finder.json";

  const fileConfig = loadFileConfig(filename);
  const envConfig = envParser.parse(process.env);

  return mergeConfigs(fileConfig, envConfig);
}
