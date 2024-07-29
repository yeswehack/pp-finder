/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import { defineAgent } from "./utils";

export default defineAgent((config, createLogger) => {

  const colorMap: Record<string, string> = {
    PP: "light-dark(#1E4667, #3465A4)",
    bind: "light-dark(#59325C, #75507B)",
    elem: "light-dark(#3E6C00, #4E9A06)",
    forIn: "light-dark(#920000, #CC0000)",
    isIn: "light-dark(#7F6D00, #C4A000)",
    prop: "light-dark(#04616D, #06989A)",
    key: "light-dark(#7F6D00, #C4A000)",
  } as const;


  return createLogger(
    config,
    {
      regex: /(http[^ (]+?):\d+:\d+/,
      depth: 3,
    },
    ({ op, key, path, pos }) => {
      const loc = `${pos[0]}:${pos[1]}`;
      return [
        `[%cPP%c][%c${op}%c] %c${JSON.stringify(
          key || "_"
        )}%cat ${path} ${loc}`,
        `color: ${colorMap.PP}`,
        "",
        `color: ${colorMap[op]}`,
        "",
        `color: ${colorMap.key}`,
      ];
    }
  );
});
