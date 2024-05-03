import type ts from "typescript";

export const OPS_NAME = [
  "forIn",
  "isIn",
  "prop",
  "elem_prop",
  "elem_key",
  "bind",
  "call",
  "start",
  "stop",
] as const;
export type PPFOp = (typeof OPS_NAME)[number];

export const AGENT_NAMES = ["node", "loader", "browser"] as const;
export type PPFAgentName = (typeof AGENT_NAMES)[number];

export interface PPFConfig {
  logOnce: boolean;
  wrapperName: string;
  color: "auto" | "always" | "never";
  lazyStart: boolean;
  log: {
    ForIn: boolean;
    IsIn: boolean;
    Prop: boolean;
    Elem: boolean;
    Bind: boolean;
  };
  logFile: string;
  pollutables: string[];
  agent: PPFAgentName;
}

export type PPFLogger = (opts: {
  op: Exclude<PPFOp, "elem_prop" | "elem_key"> | "elem";
  key?: string;
  path: string;
  pos: [number, number];
}) => void;

export type PPTransformer = (
  node: ts.Node,
  utils: PPTransformerUtils
) => ts.Node | null;

export type PPTransformerUtils = {
  config: PPFConfig;
  visit: <U extends ts.Node>(n: U) => U;
  createWrapperCall: (
    name: PPFOp,
    target: ts.Node,
    ...args: ts.Expression[]
  ) => ts.CallExpression;
};
