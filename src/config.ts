import { existsSync, readFileSync } from "fs";
import { z } from "zod";

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

const defaultTransformers = [
  'elementAccess',
  'expressionStatement',
  // 'callExpression', // TODO: unstable, doesn't work for some target
  'propertyAccess',
  'variableDeclaration',
  'objectLiteral',
  'forInStatement',
  'inExpression',
  'arrowFunction',
  'functionDeclaration',
  'functionExpression',
];

const transformersParser = z.array(z.string()).default(defaultTransformers)

export const jsonParser = z
  .object({
    $schema: z.string().optional(),
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
    logFile: z.string().default("").describe("File to log gadgets to"),
    pollutables: z
      .array(z.string())
      .default(["Object"])
      .describe("Pollutable objects"),
    agent: agentParser.default("loader").describe("Agent to use"),
    transformers: transformersParser.describe("Transformers to use"),
    skip: z.string().default("").describe("Skip files with this pattern"),
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
    PPF_LOGFILE: z.string(),
    PPF_POLLUTABLES: z.string(),
    PPF_TRANSFORMERS: z.string(),
    PPF_AGENT: agentParser,
    PPF_SKIP: z.string(),
  })
  .partial()
  .transform(
    (env): PPFPartialConfig => ({
      wrapperName: env.PPF_WRAPPER_NAME,
      logOnce: env.PPF_LOGONCE,
      skip: env.PPF_SKIP,
      color: env.PPF_COLOR,
      lazyStart: env.PPF_LAZYSTART,
      logFile: env.PPF_LOGFILE,
      pollutables: env.PPF_POLLUTABLES?.split(","),
      transformers: env.PPF_TRANSFORMERS === "all" ? defaultTransformers : env.PPF_TRANSFORMERS?.split(","),
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
      logFile: config.logFile ?? acc.logFile,
      logOnce: config.logOnce ?? acc.logOnce,
      pollutables: config.pollutables ?? acc.pollutables,
      wrapperName: config.wrapperName ?? acc.wrapperName,
      transformers: config.transformers ?? acc.transformers,
      skip: config.skip ?? acc.skip
    };
  }, defaultConfig);
}

export const defaultConfig: PPFConfig = jsonParser.parse({});
export function loadConfig() {
  const filename = process.env.PPF_CONFIG || "pp-finder.json";

  const fileConfig = loadFileConfig(filename);
  const envConfig = envParser.parse(process.env);

  return mergeConfigs(fileConfig, envConfig);
}
