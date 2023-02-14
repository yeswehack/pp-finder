import { command, flag, option, positional, string } from "cmd-ts";
import { ExistingPath } from "cmd-ts/batteries/fs";
import fs from "fs-extra";
import { createCompiler } from "../compiler";
import backupManager from "../libs/backupManager";
import { getFileNames, iterWithProgress, readFile } from "../libs/utils";

export const hookArgs = {
  path: positional({
    type: ExistingPath,
    displayName: "Path",
    description: "Path of the file or directory to instrument",
  }),
  // TODO: WIP
  // minimal: flag({
  //   long: "minimal",
  //   short: "m",
  //   defaultValue: () => false,
  //   description: "Use the minimal module",
  // }),
  // inline: flag({
  //   long: "inline",
  //   defaultValue: () => false,
  //   description: "Inject pp-finder inline in the beginning of each files",
  // }),
  wrapperName: option({
    type: string,
    long: "name",
    short: "n",
    description: 'Wrapper name, (default "ø")',
    defaultValue: () => "ø",
  }),
};

export default command({
  name: "hook",
  aliases: ["h"],
  description: "Instrument a javascript project",
  args: hookArgs,
  handler(args) {
    const files = getFileNames(args.path);

    const compiler = createCompiler({
      ...args,
      inline: true,
      minimal: false,
    });

    iterWithProgress(files, (filename) => {
      const { source, isHooked, hash } = readFile(filename);

      // skip already hooked files and cli scripts
      if (isHooked || source.startsWith("#!")) {
        return;
      }

      backupManager.backup(filename, hash);
      const relativeFilePath = filename.slice(args.path.length + 1);

      try {
        const compiled = compiler.compile(relativeFilePath, source);

        fs.writeFileSync(filename, compiled + `\n// PPFINDER: ${hash}`);
      } catch (e) {
        console.error(`Could not compile file ${relativeFilePath}`);
        console.error(e);
        process.exit(1);
      }
    });

    // TODO: WIP
    /*   if (!args.inline) {
      const nodeFolder = path.join(args.path, "node_modules");
      if (!fs.existsSync(nodeFolder)) {
        fs.mkdirSync(nodeFolder);
      }

      const modulePath = path.join(path.dirname(__filename), "module");
      const targetModulePath = path.join(nodeFolder, "pp-finder");

      fs.copySync(modulePath, targetModulePath);

      fs.renameSync(
        path.join(targetModulePath, `index.${args.module}.js`),
        path.join(targetModulePath, `index.js`)
      );
    } */
  },
});
