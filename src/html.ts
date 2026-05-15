import agents from "./agents";
import { compile } from "./compiler";
import { PPFConfig } from "./config";

const JS_SCRIPT_TYPES = new Set([
  "",
  "text/javascript",
  "application/javascript",
  "text/ecmascript",
  "application/ecmascript",
  "module",
]);

function getScriptType(attrs: string): string {
  const m = attrs.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/i);
  if (!m) return "";
  return (m[1] ?? m[2] ?? m[3] ?? "").toLowerCase().trim();
}

function hasExternalSrc(attrs: string): boolean {
  return /\bsrc\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/i.test(attrs);
}

export function buildAgentInit(config: PPFConfig, url: string): string {
  const jsonConfig = JSON.stringify(config);
  return `if (!globalThis.${config.wrapperName}) globalThis.${config.wrapperName} = (${agents.browser})(${jsonConfig},(${agents.utils}), ${JSON.stringify(url)});`;
}

export function compileHtml(config: PPFConfig, html: string, url: string): string {
  let hasJsScripts = false;

  const scriptTagRegex = /(<script(\b[^>]*)>)([\s\S]*?)(<\/script>)/gi;
  let result = html.replace(scriptTagRegex, (match, openTag, attrs, content, closeTag) => {
    const scriptType = getScriptType(attrs ?? "");
    if (!JS_SCRIPT_TYPES.has(scriptType)) return match;
    if (hasExternalSrc(attrs ?? "")) return match;
    hasJsScripts = true;
    let compiled: string;
    try {
      compiled = compile(config, content);
    } catch {
      compiled = content;
    }
    return `${openTag}${compiled}${closeTag}`;
  });

  if (!hasJsScripts) return result;

  const agentScript = `<script data-ppf="agent">\n${buildAgentInit(config, url)}\n</script>`;

  // Inject after <head> opening tag if present, otherwise before first <script>
  if (/<head[\s>]/i.test(result)) {
    result = result.replace(/(<head[^>]*>)/i, `$1\n${agentScript}`);
  } else {
    result = result.replace(/(<script)/i, `${agentScript}\n$1`);
  }

  return result;
}

export type PipeType = "html" | "js";

export function detectPipeType(options: {
  type?: string;
  contentType?: string;
  url?: string;
  content?: string;
}): PipeType {
  if (options.type === "html" || options.type === "js") return options.type;

  if (options.contentType) {
    const ct = options.contentType.toLowerCase();
    if (ct.includes("text/html")) return "html";
    if (ct.includes("javascript") || ct.includes("ecmascript")) return "js";
  }

  if (options.url) {
    const clean = options.url.split(/[?#]/)[0] ?? "";
    if (/\.html?$/i.test(clean)) return "html";
    if (/\.(js|mjs|cjs)$/i.test(clean)) return "js";
  }

  if (options.content?.trimStart().startsWith("<")) return "html";

  return "js";
}
