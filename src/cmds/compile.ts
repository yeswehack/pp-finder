import { command, option, optional, positional, string } from "cmd-ts";
import { createReadStream } from "fs";
import fs from "fs/promises";
import agents from "../agents";
import { compile } from "../compiler";
import { loadConfig } from "../config";

export default command({
  name: "compile",
  description: "Compile the specified file",
  args: {
    file: positional({
      type: string,
      description: "File to compile",
    }),
    output: option({
      type: optional(string),
      long: "output",
      short: "o",
      description: "Output folder path",
    }),
  },
  async handler({ file: filePath, output: outputFilePath }) {
    const config = loadConfig();
    const input = filePath === "-" ? process.stdin : createReadStream(filePath);

    input.setEncoding("utf-8");

    let fileData = "";
    for await (const chunk of input) {
      fileData += chunk;
    }

    const jsonConfig = JSON.stringify(config);

    const agent = agents[config.agent];
    let compiledSource = "";
    compiledSource += `globalThis.${config.wrapperName} = (${agents.setup})(${jsonConfig}, ${agent});`;
    compiledSource += "\n".repeat(3);
    compiledSource += compile(config, fileData);

    if (!outputFilePath) {
      process.stdout.write(compiledSource);
      return;
    }

    await fs.writeFile(outputFilePath, compiledSource);
  },
});
