import child_process from "child_process";
import path from "path";
import { command, option, optional, positional, rest, string } from "cmd-ts";

export default command({
  name: "run",
  description: `Run a command with pp-finder:
  ex: pp-finder run -c ./ppfinder.json  -- node test.js`,
  args: {
    cmd: positional({
      type: string,
      description: "Command to run",
    }),
    args: rest({
      description: "Args for the command",
    }),
    config: option({
      type: optional(string),
      long: "config",
      short: "c",
      defaultValue: () => "./ppfinder.json",
      description: "config file path: default is ./ppfinder.json",
    }),
    loader: option({
      type: optional(string),
      long: "loader",
      short: "l",
      defaultValue: () => path.join(__dirname, "loader.cjs"),
      description: "loader to use: defaults to the built-in loader.cjs",
    }),
  },
  async handler({ cmd, args, config: configPath, loader }) {
    child_process.spawnSync(cmd, args, {
      env: {
        ...process.env,
        PPF_CONFIG: configPath,
        NODE_OPTIONS: `--require ${JSON.stringify(path.join(__dirname, "register.cjs"))} --experimental-loader ${JSON.stringify(loader)} --no-warnings`,
      },
      stdio: 'inherit',
      shell: true,
    });
  },
});
