import assert from "assert";
import { describe, it } from "mocha";
import { createCompiler } from "../src/compiler";

function consoleWrap(f: () => any) {
  const logs: string[] = [];
  const oldLog = console.log;

  console.log = (...args: any[]) => {
    logs.push(args.join(" "));
  };

  try {
    f();
  } catch (e) {
    throw e;
  } finally {
    console.log = oldLog;
    return logs;
  }
}

function runCode(source: string) {
  const compiler = createCompiler({
    wrapperName: "XXX",
    inline: true,
    minimal: false,
  });
  process.env.PPF_NO_COLOR = "1";
  const code = compiler.compile("index.js", source);
  const logs = consoleWrap(() => eval(code));
  return logs.map((log) => log.split(" index.js:")[0]);
}

function createTest(code: string, expected: string[] = []) {
  const name =
    (expected.length ? "Pollutable     | " : "Not Pollutable | ") + code;

  it(name, () => {
    assert.deepEqual(runCode(code), expected);
  });
}

describe("Hooks", () => {
  describe("PropertyAccessExpression", () => {
    createTest(`({}).y`, ["[PP][Prop y]"]);
    createTest(`({y: 42}).y`);
    createTest(`(Object.create(null)).y`);
    createTest(`({y: {}}).y.z`, ["[PP][Prop z]"]);
  });

  describe("ElementAccessExpression", () => {
    createTest("({})['y']", ['[PP][Elem "y"]']);
    createTest("({y: 42})['y']");
    createTest("(Object.create(null))['y']");
    createTest("({y: {}})['y']['z']", ['[PP][Elem "z"]']);
  });

  describe("ForInStatement", () => {
    createTest("for(let y in ({})){}", ["[PP][ForIn]"]);
    createTest("for(let y in (Object.create(null))){}");
  });

  describe("ArrowFunctionDeclaration", () => {
    createTest("(({y}) => (0))({})", ["[PP][Bind y]"]);
    createTest("(({y}, a, {z}) => (0))({}, 0, {})", [
      "[PP][Bind y]",
      "[PP][Bind z]",
    ]);
    createTest("(({y: z}) => (0))({})", ["[PP][Bind y]"]);
  });

  describe("FunctionDeclaration", () => {
    createTest("function f({y}){return};f({})", ["[PP][Bind y]"]);
    createTest("function f({y}, a, {z}){return};f({}, 42, {})", [
      "[PP][Bind y]",
      "[PP][Bind z]",
    ]);
    createTest("function f({y: z}){return};f({})", ["[PP][Bind y]"]);
    createTest("function f({['y']: z}){return};f({})", ["[PP][Bind y]"]);
  });

  describe("FunctionExpression", () => {
    createTest("(function ({y}){return})({})", ["[PP][Bind y]"]);
    createTest("(function ({y}, a, {z}){return})({}, 0, {})", [
      "[PP][Bind y]",
      "[PP][Bind z]",
    ]);
    createTest("(function ({y: z}){return})({})", ["[PP][Bind y]"]);
    createTest("(function ({['y']: z}){return})({})", ["[PP][Bind y]"]);
  });

  describe("InExpression", () => {
    createTest('("y" in {})', ['[PP][IsIn "y"]']);
    createTest('("y" in {y: 42})');
    createTest('("y" in Object.create(null))');
  });

  describe("ObjectLiteral", () => {
    createTest("({y} = {});", ["[PP][Bind y]"]);
    createTest("({y: {z}} = {y: {}});", ["[PP][Bind y.z]"]);
    createTest("({y} = {y: 42});");
    createTest("({y} = Object.create(null));");
    createTest("({['y']: y} ={});", ["[PP][Bind y]"]);
  });

  describe("VariableDeclaration", () => {
    createTest("const {y} = {};", ["[PP][Bind y]"]);
    createTest("const {y} = {}, {z} = {};", ["[PP][Bind y]", "[PP][Bind z]"]);
    createTest("const {y: {z}} = {y: {}};", ["[PP][Bind y.z]"]);
    createTest("const {y} = {y: 42};");
    createTest("const {['y']: y} ={};", ["[PP][Bind y]"]);
    createTest("const {y} = Object.create(null);");
    createTest("let z; const {y} = {z} = {};", [
      "[PP][Bind z]",
      "[PP][Bind y]",
    ]);
  });
});

/**/
