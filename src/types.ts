import type ts from "typescript";

export const OPS_NAME = ["forIn", "isIn", "prop", "elem", "bind", "call"] as const;
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
  root: string;
}

export type PPFLogger = (opts: {
  op: PPFOp;
  key?: string;
  path: string;
  pos: [number, number];
}) => void;

export type PPFAgent = (context: PPFConfig) => PPFLogger;

export type PPTransformer = (node: ts.Node, utils: PPTransformerUtils) => ts.Node | null;

export type PPTransformerUtils = {
  config: PPFConfig;
  visit: <U extends ts.Node>(n: U) => U;
  createWrapperCall: (
    name: "forIn" | "call" | "isIn" | "prop" | "elem" | "bind" | "elem_a" | "elem_b",
    target: ts.Node,
    ...args: ts.Expression[]
  ) => ts.CallExpression;
};
