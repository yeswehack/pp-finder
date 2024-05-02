#! /usr/bin/env node
import { run as runCli, subcommands } from "cmd-ts";

import compile from "./cmds/compile";
import run from "./cmds/run";
import init from "./cmds/init";

const app = subcommands({
  name: "PP Finder",
  description: "Find prototype pollution gadget in javascript code",
  cmds: {
    init,
    compile,
    run,
  },
});

runCli(app, process.argv.slice(2));

// compilehtml

// js/html
// Hook response
// pp.finder

// hook request
