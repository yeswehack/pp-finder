import { command, positional } from "cmd-ts";
import { ExistingPath } from "cmd-ts/batteries/fs";

export default command({
  name: "restore",
  aliases: ["restore"],
  description: "Remove pp-finder hooks from a javascript file or directory",
  args: {
    path: positional({
      type: ExistingPath,
      displayName: "Path",
      description: "Path of the file or directory to restore",
    }),
  },
  handler(args) {
    console.log("restore");
    // const files = getFileNames(args.path);

    // iterWithProgress(files, (filename) => {
    //   const { isHooked } = readFile(filename);
    //   if (isHooked) {
    //     backupManager.restore(filename, isHooked);
    //   }
    // });
  },
});
