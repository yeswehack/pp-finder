#! /usr/bin/env node
import { run, subcommands } from "cmd-ts";

import compile from "./cmds/compile";

const app = subcommands({
    name: "PP Finder",
    description: "Find prototype pollution gadget in javascript code",
    cmds: {
        compile
    },
});

run(app, process.argv.slice(2));