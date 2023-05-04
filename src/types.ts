import ts from "typescript";
import { z } from "zod";

export type Location = [number, number];

export type ExpressionType = "ForIn" | "IsIn" | "Prop" | "Elem" | "Bind";

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

export const ppFinderConfig = z
  .object({
    wrapperName: z.string().default("ø").describe("Wrapper name"),
    logOnce: z
      .boolean()
      .default(false)
      .describe("Whether to log each gadget once or not"),
    color: z
      .enum(["auto", "always", "never"])
      .default("auto")
      .describe("Whether to colorize the output or not"),
    log: z
      .object({
        ForIn: z.boolean().default(true).describe("Log `for (y in x)` gadgets"),
        IsIn: z.boolean().default(true).describe("Log `y in x` gadgets"),
        Prop: z.boolean().default(true).describe("Log `x.y` gadgets"),
        Elem: z.boolean().default(true).describe("Log `x[y]` gadgets"),
        Bind: z.boolean().default(true).describe("Log `{y} = x` gadgets"),
        Internal: z.boolean().default(true).describe("Log internal gadgets"),
      })
      .default({})
      .describe("Define witch gadgets to log"),
    logFile: z
      .string()
      .default("")
      .describe("File to log gadgets to"),
    pollutable: z
      .array(z.string())
      .default(["Object.prototype"])
      .describe("Pollutable objects"),
  })
  .default({})
  .describe("PP Finder configuration file");

export type PPFinderConfig = z.infer<typeof ppFinderConfig>;
