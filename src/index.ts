import agent from "./agent";
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
    r.source = compile(config.wrapperName, r.source.toString());
  }
  return r;
};

export const globalPreload: GlobalPreloadHook = function () {
  const jsonConfig = JSON.stringify(config);
  const root = JSON.stringify(__dirname);
  return `globalThis.${config.wrapperName} = (${agent})(${root}, ${jsonConfig}, true);`;
};
