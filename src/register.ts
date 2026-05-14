import { loadConfig } from "./config";
import agents from "./agents";

const config = loadConfig();

// getBuiltin was provided by Node.js in the old globalPreload context.
// Here we're loaded via --require (CJS), so require works directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
function getBuiltin(name: string) { return require(name); }

const context = JSON.stringify(config);
// Replicate what globalPreload returned: eval gives the agent function
// access to getBuiltin via closure, exactly as globalPreload did.
// eslint-disable-next-line no-eval
eval(`globalThis.${config.wrapperName} = (${agents.loader})(${context}, (${agents.utils}), ${JSON.stringify(__dirname)})`);
