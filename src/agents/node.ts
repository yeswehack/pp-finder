/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import { defineAgent } from "./utils";

export default defineAgent((config, createLogger) => {
  const Path = require("path");

  const colorMap: Record<string, string> = {
    reset: "\x1b[0m",
    PP: "\x1b[34m",
    bind: "\x1b[35m",
    elem: "\x1b[32m",
    forIn: "\x1b[31m",
    isIn: "\x1b[33m",
    prop: "\x1b[36m",
    key: "\x1b[0;33m",
  } as const;

  const format = (color: keyof typeof colorMap, text: string, wraps = "") => {
    const prefix = wraps.length == 2 ? wraps[0] : "";
    const suffix = wraps.length == 2 ? wraps[1] : "";

    if (!config.color) {
      return `${prefix}${text}${suffix}`;
    }

    return `${prefix}${colorMap[color]}${text}${colorMap.reset}${suffix}`;
  };

  return createLogger(
    config,
    {
      regex: /([^ (]+?):\d+:\d+/,
      depth: 3,
    },
    ({ op, key, path, pos }) => {
      const shortPath = Path.relative(process.cwd(), path);
      const loc = `${pos[0]}:${pos[1]}`;
      return [
        `${format("PP", "PP", "[]")}${format(op, op, "[]")} ${format(
          "key",
          JSON.stringify(key || "_")
        )} at ${shortPath}:${loc}`,
      ];
    }
  );
});
