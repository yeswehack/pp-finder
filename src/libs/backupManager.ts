import path from "path";
import { z } from "zod";
import { InvalidBackupError } from "../errors";
import fs from "fs-extra";
import os from "os";
import crypto from "crypto";

const backupValidator = z.record(z.string());
const configFolder = path.join(os.homedir(), ".local/share/pp-finder");
const paths = {
  backups: path.join(configFolder, "backups"),
};

// make sure the backup folder exists
fs.ensureDir(configFolder);
fs.ensureDir(paths.backups);

export default {
  purge(filename?: string) {
    fs.mkdirSync(paths.backups);
    return 0;
  },
  backup(filename: string, hash: string) {
    const backupPath = path.join(paths.backups, hash);
    if (!fs.existsSync(backupPath)) {
      fs.copySync(filename, backupPath);
    }
    return hash;
  },
  restore(filename: string, hash: string) {
    const backupPath = path.join(paths.backups, hash);
    if (!fs.existsSync(backupPath)) {
      return false;
    }

    try {
      fs.copySync(backupPath, filename, {
        overwrite: true,
      });
    } catch (e) {
      console.log(e);
      return false;
    }
    return true;
  },
};
