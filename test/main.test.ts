import assert from "assert";
import { describe, it } from "mocha";
import { compile } from "../src/compiler";
import agent from "../src/agent";
import vm from "node:vm";
import { PPFinderConfig } from "../src/types";

const config: PPFinderConfig = {
  color: "never",
  logFile: "",
  logOnce: false,
  log: {
    ForIn: true,
    IsIn: true,
    Prop: true,
    Elem: true,
    Bind: true,
  },
  pollutable: ["Object.prototype"],
  wrapperName: "PP",
};

function runCode(source: string) {
  const jsonConfig = JSON.stringify(config);
  const code =
    `globalThis.${config.wrapperName}Create = (${agent})('${__dirname}/../dist', ${jsonConfig});\n` +
    compile(config.wrapperName, "index.js", source);

  const output: string[] = [];
  const fakeConsole = {
    log(msg: string) {
      output.push(msg);
    },
  };
  const context: any = { getBuiltin: require, console: fakeConsole };
  vm.createContext(context);
  const result = vm.runInContext(code, context);
  const logs = output.map((log) => log.split(" index.js:")[0]);

  return { result, logs };
}

function pollutionTest(code: string, expected: string[] = []) {
  const name =
    (expected.length ? "Valid Gadget     | " : "Not Valid Gadget | ") + code;

  it(name, () => {
    assert.deepEqual(runCode(code).logs, expected);
  });
}

function valueTest(code: string, expected: any) {
  const name = code;

  it(name, () => {
    assert.deepEqual(runCode(code).result, expected);
  });
}

describe("Hooks", () => {
  describe("PropertyAccessExpression", () => {
    pollutionTest(`({}).y`, ["[PP][Prop y]"]);
    pollutionTest(`({y: 42}).y`);
    pollutionTest(`(Object.create(null)).y`);
    pollutionTest(`({y: {}}).y.z`, ["[PP][Prop z]"]);
  });

  describe("ElementAccessExpression", () => {
    pollutionTest("({})['y']", ["[PP][Elem y]"]);
    pollutionTest("({y: 42})['y']");
    pollutionTest("(Object.create(null))['y']");
    pollutionTest("({y: {}})['y']['z']", ["[PP][Elem z]"]);
  });

  describe("ForInStatement", () => {
    pollutionTest("for(let y in ({})){}", ["[PP][ForIn]"]);
    pollutionTest("for(let y in (Object.create(null))){}");
  });

  describe("ArrowFunctionDeclaration", () => {
    pollutionTest("(({y}) => (0))({})", ["[PP][Bind y]"]);
    pollutionTest("(({y}, a, {z}) => (0))({}, 0, {})", [
      "[PP][Bind y]",
      "[PP][Bind z]",
    ]);
    pollutionTest("(({y: z}) => (0))({})", ["[PP][Bind y]"]);
  });

  describe("FunctionDeclaration", () => {
    pollutionTest("function f({y}){return};f({})", ["[PP][Bind y]"]);
    pollutionTest("function f({y}, a, {z}){return};f({}, 42, {})", [
      "[PP][Bind y]",
      "[PP][Bind z]",
    ]);
    pollutionTest("function f({y: z}){return};f({})", ["[PP][Bind y]"]);
    pollutionTest("function f({['y']: z}){return};f({})", ["[PP][Bind y]"]);
  });

  describe("FunctionExpression", () => {
    pollutionTest("(function ({y}){return})({})", ["[PP][Bind y]"]);
    pollutionTest("(function ({y}, a, {z}){return})({}, 0, {})", [
      "[PP][Bind y]",
      "[PP][Bind z]",
    ]);
    pollutionTest("(function ({y: z}){return})({})", ["[PP][Bind y]"]);
    pollutionTest("(function ({['y']: z}){return})({})", ["[PP][Bind y]"]);
  });

  describe("InExpression", () => {
    pollutionTest('("y" in {})', ["[PP][IsIn y]"]);
    pollutionTest('("y" in {y: 42})');
    pollutionTest('("y" in Object.create(null))');
  });

  describe("ObjectLiteral", () => {
    pollutionTest("({y} = {});", ["[PP][Bind y]"]);
    pollutionTest("({y: {z}} = {y: {}});", ["[PP][Bind y.z]"]);
    pollutionTest("({y} = {y: 42});");
    pollutionTest("({y} = Object.create(null));");
    pollutionTest("({['y']: y} ={});", ["[PP][Bind y]"]);
  });

  describe("VariableDeclaration", () => {
    pollutionTest("const {y} = {};", ["[PP][Bind y]"]);
    pollutionTest("const {y} = {}, {z} = {};", [
      "[PP][Bind y]",
      "[PP][Bind z]",
    ]);
    pollutionTest("const {y: {z}} = {y: {}};", ["[PP][Bind y.z]"]);
    pollutionTest("const {y} = {y: 42};");
    pollutionTest("const {['y']: y} ={};", ["[PP][Bind y]"]);
    pollutionTest("const {y} = Object.create(null);");
    pollutionTest("let z; const {y} = {z} = {};", [
      "[PP][Bind z]",
      "[PP][Bind y]",
    ]);
  });
});
describe("Assignation check", () => {
  valueTest("const x = {}; x.y = 42; x.y", 42);
  valueTest("const x = {}; x['y'] = 42; x.y", 42);
});

/**/
