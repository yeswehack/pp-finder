import child_process from "child_process";
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
      defaultValue: () => "pp-finder",
      description: "loader to use: default is pp-finder",
    }),
  },
  async handler({ cmd, args, config: configPath, loader }) {
    child_process.spawnSync(cmd, args, {
      env: {
        ...process.env,
        PPF_CONFIG: configPath,
        NODE_OPTIONS: `--experimental-loader ${JSON.stringify(loader)} --no-warnings`,
      },
      stdio: 'inherit',
      shell: true,
    });
  },
});
