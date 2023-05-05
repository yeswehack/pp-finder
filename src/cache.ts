import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PPFinderConfig } from "./types";

export default class Cache {
    cacheDir: string;
    hashAlgorithm: string = 'sha256';
    extension: string = "cache";
    config: PPFinderConfig;

    constructor(config: PPFinderConfig) {
        this.config = config;
        this.cacheDir = path.join(__dirname, "..", "node_modules", ".cache", "pp-finder");
        fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    getFilePath(digest: string) {
        return path.join(this.cacheDir, `${digest}.${this.extension}`);
    }

    store(source: string, compiledSource: string) {
        const digest = this.hash(source);
        const filePath = this.getFilePath(digest);

        fs.writeFileSync(filePath, compiledSource);
    }

    get(source: string): string | undefined {
        const digest = this.hash(source);
        const filePath = this.getFilePath(digest);

        try {
            return fs.readFileSync(filePath, { encoding: 'utf-8' });
        } catch (e) {
            return;
        }
    }

    hash(source: string): string {
        const h = crypto.createHash(this.hashAlgorithm);

        h.update(source);
        h.update(JSON.stringify(this.config));

        return h.digest('hex');
    }
}