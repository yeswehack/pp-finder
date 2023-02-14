import { flag, option, positional, string, Type } from "cmd-ts";
import { Directory } from "cmd-ts/batteries/fs";
import path from "path";
import { PPArgs } from "./types";

const StringList: Type<string, Set<string> | undefined> = {
  async from(input) {
    return new Set(input.split(",").map((s) => s.trim()));
  },
};

const srcDir = positional({
  type: Directory,
  displayName: "Source dir",
  description: "Directory of the targeted application",
});

const outDir = positional({
  type: {
    from: async (s: string) => {
      if (s.startsWith("/")) return s;
      return path.join(process.cwd(), s)
    }
  },
  displayName: "Out dir",
  description: "Output directory",
});

const include = option({
  type: StringList,
  long: "include",
  short: "i",
  defaultValue: () => undefined,
  description: "Comma separated list of node-module to include",
});

const exclude = option({
  type: StringList,
  long: "exclude",
  short: "e",
  defaultValue: () => undefined,
  description: "Comma separated list of node-module to exclude",
});

const wrapperName = option({
  type: string,
  long: "name",
  short: "n",
  description: 'Wrapper name, (default "ø")',
  defaultValue: () => "ø",
});

const deletee = flag({
  long: "delete",
  short: "d",
  defaultValue: () => false,
  description: "Delete the output directory before running.",
});

const moduleName = option({
  type: {
    from: async (input: string) => {
      const s = input.toLocaleLowerCase()
      const validModes = ["classic", "minimal"]
      if (validModes.includes(s)) {
        return s as PPArgs["module"]
      }

      throw new Error(`Invalid module name "${input}"`)
    }
  },
  long: 'module',
  short: 'j',
  defaultValue: () => 'classic' as const,
  description: "Which module to use ( classic, minimal )"
});

const hookMode = option({
  type: {
    from: async (input: string) => {
      const s = input.toLocaleLowerCase()
      const validModes = ["inline", "require"]
      if (validModes.includes(s)) {
        return s as PPArgs["hookMode"]
      }

      throw new Error(`Invalid hook mode "${input}"`)
    }
  },
  long: 'mode',
  short: 'm',
  defaultValue: () => 'require' as const,
  description: "Which mode to use to inject pp-finder"
});

export default {
  delete: deletee,
  wrapperName,
  exclude,
  include,
  outDir,
  srcDir,
  hookMode,
  module: moduleName
};
