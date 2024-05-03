import ts from "typescript";
import { defineTransformer } from "./utils";

// "start pp-finder" | "stop pp-finder"
export default defineTransformer((node, utils) => {
  // Check
  if (!ts.isExpressionStatement(node) || !ts.isStringLiteral(node.expression)) {
    return null;
  }
  if (node.expression.text === "start pp-finder") {
    return utils.createPPFCall("start", node);
  } else if (node.expression.text === "stop pp-finder") {
    return utils.createPPFCall("stop", node);
  } else {
    return null;
  }
});
