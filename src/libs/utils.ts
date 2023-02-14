import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

function* iterFiles(dirName: string) {
  function* iterator(dirName: string): Generator<string> {
    const dir = fs.opendirSync(dirName);
    let f: fs.Dirent | null;

    while ((f = dir.readSync())) {
      const fullPath = path.join(dirName, f.name);

      if (f.isFile() && path.extname(f.name) === ".js") {
        yield fullPath;
      }

      if (f.isDirectory()) {
        const parent = path.basename(dirName);
        if (parent === "node_modules") {
        }

        yield* iterator(fullPath);
      }
    }
    dir.closeSync();
  }

  yield* iterator(dirName);
}

export function getFileNames(pathname: string) {
  const stat = fs.statSync(pathname);

  const files = [];
  if (stat.isDirectory()) {
    console.log("Computing file list...");
    for (const file of iterFiles(pathname)) {
      files.push(file);
    }
  } else {
    files.push(pathname);
  }
  return files;
}
function isHooked(source: string) {
  const match = source.match(/^\/\/ PPFINDER: (?<hash>[0-9a-f]{32})$/im);
  if (match) {
    return match.groups!.hash;
  }
  return false;
}

export function readFile(filename: string) {
  const source = fs.readFileSync(filename, {
    encoding: "utf-8",
  });

  const md5 = crypto.createHash("md5");
  const hash = md5.update(source).digest("hex");

  return { source, hash, isHooked: isHooked(source) } as const;
}

export function iterWithProgress<T>(arr: T[], callback: (item: T) => void) {
  const total = arr.length;

  for (let i = 0; i < total; i++) {
    const item = arr[i];
    callback(item);
    const pct = Math.round(((i + 1) * 100) / total);
    process.stdout.write(`\r${i + 1}/${total} files ${pct}%`);
  }
  process.stdout.write("\n");
}
