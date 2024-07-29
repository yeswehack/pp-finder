import { command, option, flag, boolean } from "cmd-ts";
import fs from "fs";
import { jsonParser } from "../config";

export default command({
  name: "init",
  description: `Create a ppfinder.json file in the current directory`,
  args: {
    write: flag({
      type: boolean,
      long: "write",
      short: "w",
      description: "Output folder path",
    }),
  },
  async handler({ write }) {
    if (fs.existsSync("./ppfinder.json") && !write) {
      console.log("ppfinder.json already exists, use -w to overwrite.");
      return;
    }
    const config = jsonParser.parse({}) as any;
    config["$schema"] = `${__dirname}/pp-finder.schema.json`;
    fs.writeFileSync("./ppfinder.json", JSON.stringify(config, null, 2));
  },
});
