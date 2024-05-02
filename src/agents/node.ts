/**
 * WARNING !
 * This file is used as a string by the loader, all the code must be inside the default export function
 * and must not have any dependencies
 */

import { PPFAgent } from "../types";

const agent: PPFAgent = (config) => {
  return ({ op, key, path, pos }) => {
    const shortPath = require("path").relative(__dirname, path);
    console.log(shortPath);
    console.log(__dirname);
    console.log(path);
    if (key) {
      console.log(`[PP][${op}] ${key} at ${shortPath}`);
    } else {
      console.log(`[PP][${op}] at ${shortPath}`);
    }
  };
};

export default agent;
