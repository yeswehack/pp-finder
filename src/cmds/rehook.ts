import { command, flag, option, positional, string } from "cmd-ts";
import { ExistingPath } from "cmd-ts/batteries/fs";
import fs from "fs-extra";
import { createCompiler } from "../compiler";
import backupManager from "../libs/backupManager";
import { getFileNames, iterWithProgress, readFile } from "../libs/utils";
import hook, { hookArgs } from "./hook";
import restore from "./restore";

export default command({
  name: "rehook",
  aliases: ["r"],
  description: "Restore then instrument a javascript project",
  args: hookArgs,
  handler(args) {
    restore.handler(args);
    hook.handler(args);
  },
});
