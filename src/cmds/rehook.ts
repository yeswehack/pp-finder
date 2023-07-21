import { command } from "cmd-ts";
import { hookArgs } from "./hook";

export default command({
  name: "rehook",
  aliases: ["r"],
  description: "Restore then instrument a javascript project",
  args: hookArgs,
  handler(args) {
    // restore.handler(args);
    // hook.handler(args);
    console.log("rehook")
  },
});
