#! /usr/bin/env node
import { run, subcommands } from "cmd-ts";

import compile from "./cmds/compile";
import hook from "./cmds/hook";
import purge from "./cmds/purge";
import rehook from "./cmds/rehook";
import restore from "./cmds/restore";

const app = subcommands({
    name: "PP Finder",
    description: "Find prototype pollution gadget in javascript code",
    cmds: {
        hook,
        rehook,
        restore,
        purge,
        compile
    },
});

run(app, process.argv.slice(2));