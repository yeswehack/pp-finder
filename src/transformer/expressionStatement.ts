import ts from "typescript";
import { defineTransformer } from "./utils";

// "start pp-finder" | "stop pp-finder"
export default defineTransformer('expressionStatement', (node, utils) => {
  // Check
  if (!ts.isExpressionStatement(node) || !ts.isStringLiteral(node.expression)) {
    return null;
  }
  if (node.expression.text === "pp-finder start") {
    return utils.createPPFCall("start", node);
  } else if (node.expression.text === "pp-finder stop") {
    return utils.createPPFCall("stop", node);
  } else {
    return null;
  }
});
