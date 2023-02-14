#! /usr/bin/env node
import { run, subcommands } from "cmd-ts";

import restore from "./cmds/restore";
import hook from "./cmds/hook";
import rehook from "./cmds/rehook";
import purge from "./cmds/purge";

const app = subcommands({
  name: "PP-Finder",
  description: "Find prototype pollution gadget in javascript code",
  cmds: {
    hook,
    rehook,
    restore,
    purge,
  },
});

async function main() {
  await run(app, process.argv.slice(2));
}

if (require.main === module) {
  main();
}
