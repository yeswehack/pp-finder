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
    },
    async handler({ file: filePath, wrapperName, output: outputFilePath, browser }) {
        const input = filePath === "-" ? process.stdin : createReadStream(filePath);

        input.setEncoding("utf-8");

        let fileData = "";
        for await (const chunk of input) {
            fileData += chunk;
        }

        const jsonConfig = JSON.stringify(config);

        let compiledSource = ""

        if (browser) {
            compiledSource += `const getBuiltin = (${getBuiltinBrowser});`;
        } else {
            compiledSource += `const getBuiltin = (${getBuiltinNode});`;
        }

        const root = JSON.stringify(path.join(__dirname, ".."));

        compiledSource += `const ${wrapperName} = (${agent})(${root}, ${jsonConfig}, false);`
        compiledSource += '\n\n\n';
        compiledSource += compile(wrapperName, fileData);


        if (!outputFilePath) {
            console.log(compiledSource);
            return
        }

        await fs.writeFile(outputFilePath, compiledSource);
    },
});
