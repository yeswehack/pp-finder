import { command, option, optional, string } from "cmd-ts";
import agents from "../agents";
import { compile } from "../compiler";
import { loadConfig } from "../config";
import { compileHtml, detectPipeType } from "../html";

export default command({
  name: "pipe",
  description: `Instrument JS/HTML from stdin and write to stdout. For use with Burp Piper.
  ex: pp-finder pipe --content-type "text/javascript" --url "http://example.com/app.js"`,
  args: {
    type: option({
      type: optional(string),
      long: "type",
      short: "t",
      description: 'Force input type: "html" or "js"',
    }),
    contentType: option({
      type: optional(string),
      long: "content-type",
      description: "Content-Type header value (used for type detection)",
    }),
    url: option({
      type: optional(string),
      long: "url",
      description: "URL of the resource (used for type detection and shown in logs)",
    }),
    config: option({
      type: optional(string),
      long: "config",
      short: "c",
      defaultValue: () => "./ppfinder.json",
      description: "Config file path (default: ./ppfinder.json)",
    }),
  },
  async handler({ type: typeFlag, contentType, url }) {
    process.stdin.setEncoding("utf-8");
    let content = "";
    for await (const chunk of process.stdin) {
      content += chunk;
    }

    const config = loadConfig();
    const resolvedUrl = url ?? "";
    const detectedType = detectPipeType({
      type: typeFlag ?? undefined,
      contentType: contentType ?? undefined,
      url: resolvedUrl || undefined,
      content,
    });

    let output: string;
    if (detectedType === "html") {
      output = compileHtml(config, content, resolvedUrl);
    } else {
      const agentInit = `if (!globalThis.${config.wrapperName}) globalThis.${config.wrapperName} = (${agents.browser})(${JSON.stringify(config)},(${agents.utils}), ${JSON.stringify(resolvedUrl)});\n\n\n`;
      output = agentInit + compile(config, content);
    }

    process.stdout.write(output);
  },
});
