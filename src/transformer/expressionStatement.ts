import ts from "typescript";
import { PPTransformer } from "../types";

// "start pp-finder" | "stop pp-finder"
export const expressionStatementTransformer: PPTransformer = (node, utils) => {
  // Check
  if (!ts.isExpressionStatement(node) || !ts.isStringLiteral(node.expression)) {
    return null;
  }
  if (node.expression.text === "start pp-finder") {
    return utils.createWrapperCall("start", node);
  } else if (node.expression.text === "stop pp-finder") {
    return utils.createWrapperCall("stop", node);
  } else {
    return null;
  }
};

export default expressionStatementTransformer;
