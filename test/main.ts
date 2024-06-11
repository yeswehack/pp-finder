import select from "@inquirer/select";
import child_process from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function* iterTests(testsPath: string, resultsPath: string): Generator<[string, string]> {
  for (const file of fs.readdirSync(testsPath)) {
    const testPath = path.join(testsPath, file);
    const resultPath = path.join(resultsPath, file);
    if (fs.statSync(testPath).isDirectory()) {
      yield* iterTests(testPath, resultPath);
      continue;
    }

    if (!testPath.endsWith(".test.js")) {
      continue;
    }

    yield [testPath, resultPath.replace(/\.test\.js$/, ".result.txt")];
  }
}

async function runTest(testPath: string, resultPath: string) {
  const testContent = fs.readFileSync(testPath, "utf-8");
  const resultContent = fs.existsSync(resultPath) ? fs.readFileSync(resultPath, "utf-8") : null;

  const result = child_process
    .execFileSync(
      "node",
      ["--loader", "./dist/loader.cjs", "--no-warnings", testPath],
      {
        env: {
          ...process.env,
          'PPF_COLOR': 'never',
        }
      }
    )
    .toString()
    .trim();
  if (resultContent === null) {
    console.log(`First run: ${testPath}`);
    console.log(`Sources:\n\n${testContent}\n${"-".repeat(80)}`);
    console.log(`Got:\n\n${result}\n${"-".repeat(80)}`);

    const response = await select({
      message: "What should we do?",
      choices: [
        {
          name: "save",
          value: "save",
          description: "Save the result as the expected result",
        },
        {
          name: "continue",
          value: "continue",
          description: "Continue without saving",
        },
        {
          name: "exit",
          value: "exit",
          description: "Exit the tests",
        },
      ],
    });

    if (response === "save") {
      fs.writeFileSync(resultPath, result);
    }

    if (response === "exit") {
      process.exit(0);
    }
  } else if (result !== resultContent) {
    console.log(`Test failed: ${testPath}`);
    console.log(`Expected:\n\n${resultContent}\n${"-".repeat(80)}`);
    console.log(`Got:\n\n${result}\n${"-".repeat(80)}`);

    const response = await select({
      message: "What should we do?",
      choices: [
        {
          name: "continue",
          value: "continue",
          description: "Continue without saving",
        },
        {
          name: "save",
          value: "save",
          description: "Save the new result as the expected result",
        },
        {
          name: "exit",
          value: "exit",
          description: "Exit the tests",
        },
      ],
    });

    if (response === "save") {
      fs.writeFileSync(resultPath, result);
    }

    if (response === "exit") {
      process.exit(0);
    }
  }
}

async function main() {
  const testDir = path.resolve(__dirname, "./tests");
  const resultDir = path.resolve(__dirname, "./results");

  for (const [testPath, resultPath] of iterTests(testDir, resultDir)) {
    console.log(`Running test: ${path.basename(testPath)}`);
    await runTest(testPath, resultPath);
  }
}

main();
