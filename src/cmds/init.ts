import child_process from "child_process";
import { Type, command, option, optional, positional, string, rest } from "cmd-ts";
import fs from "fs";
import { jsonParser } from "../config";

export default command({
  name: "init",
  description: `Create a ppfinder.json file in the current directory`,
  args: {},
  async handler() {
    if (fs.existsSync("./ppfinder.json")) {
      console.log("ppfinder.json already exists");
      return;
    }
    fs.writeFileSync("./ppfinder.json", JSON.stringify(jsonParser.parse({}), null, 2));
  },
});
