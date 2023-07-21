import { command, optional, positional } from "cmd-ts";
import { ExistingPath } from "cmd-ts/batteries/fs";

export default command({
  name: "purge",
  description: "Purge all backups",
  args: {
    path: positional({
      type: optional(ExistingPath),
      displayName: "path",
      description: "Path of the file or directory to remove from the backup",
    }),
  },
  handler({ path }) {
    console.log("purge");
    // const removed = backupManager.purge(path);
    // console.log("Removed " + removed + " backups");
  },
});
