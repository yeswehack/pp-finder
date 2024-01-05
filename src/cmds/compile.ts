import { command, flag, option, optional, string } from "cmd-ts";
import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import agent from "../agent";
import { compile } from "../compiler";
import { loadConfig } from "../config";

const config = loadConfig();

function getBuiltinNode<T>(module: string): T {
    return require(module);
}

function getBuiltinBrowser<T>(_: string): null {
    return null
}

export default command({
    name: "compile",
    description: "Compile the specified file",
    args: {
        file: option({
            type: string,
            long: "file",
        }),
        wrapperName: option({
            type: string,
            long: "name",
            short: "w",
            description: 'Wrapper name, (default "ø")',
            defaultValue: () => "ø",
        }),
        output: option({
            type: optional(string),
            long: "output",
            short: "o",
            description: 'Output file path',
        }),
        browser: flag({
            long: "browser",
            short: "b",
            defaultValue: () => false,
            description: "Compile the provided file for the browser",
        }),
        reportUrl: option({
            type: optional(string),
            long: "report-url",
            short: "u",
            description: 'Which url to print in the output (required for the burp extension)',
        })
    },
    async handler({ file: filePath, wrapperName, output: outputFilePath, browser, reportUrl }) {
        const input = filePath === "-" ? process.stdin : createReadStream(filePath);

        input.setEncoding("utf-8");

        let fileData = "";
        for await (const chunk of input) {
            fileData += chunk;
        }

        config.browser = browser;
        const jsonConfig = JSON.stringify(config);

        const root = JSON.stringify(path.join(__dirname, ".."));

        const globalKey = browser ? "window" : "globalThis";

        let compiledSource = ""

        compiledSource += `${globalKey}.reportUrl = ("${reportUrl}");`;
        compiledSource += `${globalKey}.getBuiltin = (${browser ? getBuiltinBrowser : getBuiltinNode});`;
        compiledSource += `${globalKey}.${wrapperName} = (${agent})(${root}, ${jsonConfig}, false);`
        compiledSource += '\n'.repeat(3);
        compiledSource += compile(wrapperName, fileData);

        if (!outputFilePath) {
            process.stdout.write(compiledSource);
            return
        }

        await fs.writeFile(outputFilePath, compiledSource);
    },
});
