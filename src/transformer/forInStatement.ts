import ts from "typescript";
import { defineTransformer } from "./utils";

// for (let y in x)
export default defineTransformer('forInStatement', (node, utils) => {
  // Check
  if (!ts.isForInStatement(node)) {
    return null;
  }

  // Transform
  const newNode = utils.createPPFCall(
    "forIn",
    node.expression,
    utils.visit(node.expression)
  );

  return ts.factory.updateForInStatement(
    node,
    utils.visit(node.initializer),
    newNode,
    utils.visit(node.statement)
  );
});
