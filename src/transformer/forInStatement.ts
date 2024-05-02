import ts from "typescript";
import { PPTransformer } from "../types";

// for (let y in x)
export const forInStatementTransformer: PPTransformer = (node, utils) => {
  // Check
  if (!ts.isForInStatement(node)) {
    return null;
  }

  // Transform
  const newNode = utils.createWrapperCall("forIn", node.expression, utils.visit(node.expression));

  return ts.factory.updateForInStatement(
    node,
    utils.visit(node.initializer),
    newNode,
    utils.visit(node.statement)
  );
};

export default forInStatementTransformer;
