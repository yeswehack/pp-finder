import select from "@inquirer/select";
import child_process from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { compileHtml } from "../src/html";
import { defaultConfig } from "../src/config";

type TestEntry = { testPath: string; resultPath: string; kind: "js" | "html" };

function* iterTests(testsPath: string, resultsPath: string): Generator<TestEntry> {
  for (const file of fs.readdirSync(testsPath)) {
    const testPath = path.join(testsPath, file);
    const resultPath = path.join(resultsPath, file);
    if (fs.statSync(testPath).isDirectory()) {
      yield* iterTests(testPath, resultPath);
      continue;
    }

    if (testPath.endsWith(".test.js")) {
      yield { testPath, resultPath: resultPath.replace(/\.test\.js$/, ".result.txt"), kind: "js" };
    } else if (testPath.endsWith(".test.html")) {
      yield { testPath, resultPath: resultPath.replace(/\.test\.html$/, ".result.txt"), kind: "html" };
    }
  }
}

async function handleMismatch(
  testPath: string,
  resultPath: string,
  testContent: string,
  resultContent: string | null,
  result: string
) {
  if (resultContent === null) {
    console.log(`First run: ${testPath}`);
    console.log(`Sources:\n\n${testContent}\n${"-".repeat(80)}`);
    console.log(`Got:\n\n${result}\n${"-".repeat(80)}`);

    const response = await select({
      message: "What should we do?",
      choices: [
        { name: "save", value: "save", description: "Save the result as the expected result" },
        { name: "continue", value: "continue", description: "Continue without saving" },
        { name: "exit", value: "exit", description: "Exit the tests" },
      ],
    });

    if (response === "save") fs.writeFileSync(resultPath, result);
    if (response === "exit") process.exit(0);
  } else if (result !== resultContent) {
    console.log(`Test failed: ${testPath}`);
    console.log(`Expected:\n\n${resultContent}\n${"-".repeat(80)}`);
    console.log(`Got:\n\n${result}\n${"-".repeat(80)}`);

    const response = await select({
      message: "What should we do?",
      choices: [
        { name: "continue", value: "continue", description: "Continue without saving" },
        { name: "save", value: "save", description: "Save the new result as the expected result" },
        { name: "exit", value: "exit", description: "Exit the tests" },
      ],
    });

    if (response === "save") fs.writeFileSync(resultPath, result);
    if (response === "exit") process.exit(0);
  }
}

async function runTest(testPath: string, resultPath: string) {
  const testContent = fs.readFileSync(testPath, "utf-8");
  const resultContent = fs.existsSync(resultPath) ? fs.readFileSync(resultPath, "utf-8") : null;

  const result = child_process
    .execFileSync(
      "node",
      ["--require", "./dist/register.cjs", "--loader", "./dist/loader.cjs", "--no-warnings", testPath],
      { env: { ...process.env, PPF_COLOR: "never" } }
    )
    .toString()
    .trim();

  await handleMismatch(testPath, resultPath, testContent, resultContent, result);
}

async function runHtmlTest(testPath: string, resultPath: string) {
  const testContent = fs.readFileSync(testPath, "utf-8");
  const resultContent = fs.existsSync(resultPath) ? fs.readFileSync(resultPath, "utf-8") : null;

  const config = { ...defaultConfig, color: false };
  const compiled = compileHtml(config, testContent, "");
  // Strip agent script body for a stable snapshot (agent code changes shouldn't break tests)
  const result = compiled.replace(
    /<script data-ppf="agent">[\s\S]*?<\/script>/gi,
    "<script data-ppf=\"agent\"></script>"
  );

  await handleMismatch(testPath, resultPath, testContent, resultContent, result);
}

async function main() {
  const testDir = path.resolve(__dirname, "./tests");
  const resultDir = path.resolve(__dirname, "./results");

  for (const entry of iterTests(testDir, resultDir)) {
    console.log(`Running test: ${path.basename(entry.testPath)}`);
    if (entry.kind === "html") {
      await runHtmlTest(entry.testPath, entry.resultPath);
    } else {
      await runTest(entry.testPath, entry.resultPath);
    }
  }
}

main();
