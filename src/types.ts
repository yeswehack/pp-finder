import ts from "typescript";

export interface PPArgs {
  // TODO: WIP
  module: "classic" | "minimal";
  hookMode: "inline" | "require";
  path: string;
  wrapperName: string;
}

export type Location = [number, number];

export interface Compiler {
  compile(filename: string, source: string): string;
}

export type ExpressionType = "ForIn" | "IsIn" | "Prop" | "Elem" | "Bind";
export type PPLogger = (
  expressionType: ExpressionType,
  location: [number, number],
  key?: string
) => void;

export type PPTransformer = (
  node: ts.Node,
  utils: PPTransformerUtils
) => ts.Node | null;

export type PPTransformerUtils = {
  wrapperName: string;
  visit: <U extends ts.Node>(n: U) => U;
  createWrapperCall: (
    name: string,
    target: ts.Node,
    params: ts.Expression[]
  ) => ts.CallExpression;
};
