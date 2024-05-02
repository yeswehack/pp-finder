import agents from "./agents";
import { compile } from "./compiler";
import { loadConfig } from "./config";

type Format = "builtin" | "commonjs" | "dynamic" | "json" | "module" | "wasm";

interface LoadContext {
  conditions: string[];
  format?: Format | null;
  importAssertions?: Record<string, string>;
}

interface LoadReturn {
  format?: Format | null;
  shortCircuit?: boolean;
  source: string | ArrayBuffer;
}

type LoadHook = (
  url: string,
  context: LoadContext,
  nextLoad: (url: string, context: LoadContext) => Promise<LoadReturn>
) => Promise<LoadReturn>;

type GlobalPreloadHook = () => string;

const config = loadConfig();

export const load: LoadHook = async function (url, context, nextLoad) {
  const r = await nextLoad(url, context);
  if (context.format === "module" && r.source) {
    r.source = compile(config, r.source.toString());
  }
  return r;
};

export const globalPreload: GlobalPreloadHook = function () {
  config.root = __dirname;
  const context = JSON.stringify(config);
  const agent = agents[config.agent];
  return (
    `globalThis.${config.wrapperName} = (${agents.setup})(${context}, ${agent});`
  );
};
