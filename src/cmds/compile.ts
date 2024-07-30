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
    agent: option({
      type: optional(string),
      long: "agent",
      short: "a",
      description: "Agent to use, browser or node",
      defaultValue: () => "node",
    }),
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
  async handler({ file: filePath, output: outputFilePath, agent: agentName }) {
    const config = loadConfig();
    const input = filePath === "-" ? process.stdin : createReadStream(filePath);

    input.setEncoding("utf-8");

    let fileData = "";
    for await (const chunk of input) {
      fileData += chunk;
    }

    const jsonConfig = JSON.stringify(config);

    if (agentName !== "browser" && agentName !== "node") {
      throw new Error("Agent must be either browser or node");
    }

    const agent = agents[agentName];
    let compiledSource = "";
    compiledSource += `const ${
      config.wrapperName
    } = (${agent})(${jsonConfig},(${agents.utils}), ${JSON.stringify(
      filePath
    )});`;
    compiledSource += "\n".repeat(3);
    compiledSource += compile(config, fileData);

    if (!outputFilePath) {
      process.stdout.write(compiledSource);
      return;
    }

    await fs.writeFile(outputFilePath, compiledSource);
  },
});
