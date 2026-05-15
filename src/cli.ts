#! /usr/bin/env node
import { run as runCli, subcommands } from "cmd-ts";

import compile from "./cmds/compile";
import run from "./cmds/run";
import init from "./cmds/init";
import pipe from "./cmds/pipe";

const app = subcommands({
  name: "PP Finder",
  description: "Find prototype pollution gadget in javascript code",
  cmds: {
    init,
    compile,
    run,
    pipe,
  },
});

runCli(app, process.argv.slice(2));