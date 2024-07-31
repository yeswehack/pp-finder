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

const skipRegex = config.skip && new RegExp(config.skip);
export const load: LoadHook = async function (url, context, nextLoad) {
  const r = await nextLoad(url, context);
  if (skipRegex && skipRegex.test(url)) {
    return r;
  }

  if (context.format === "module" && r.source) {
    r.source = compile(config, r.source.toString());
  }
  return r;
};

export const globalPreload: GlobalPreloadHook = function () {
  const context = JSON.stringify(config);
  return `globalThis.${config.wrapperName} = (
  ${agents.loader})(${context}, 
  (${agents.utils}),
  ${JSON.stringify(__dirname)}
);`;
};
