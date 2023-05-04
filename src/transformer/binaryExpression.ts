import ts from "typescript";
import { PPTransformer } from "../types";

export const binaryExpressionTransformer: PPTransformer = (node, utils) => {
  if (!ts.isBinaryExpression(node)) {
    return null;
  }

  return ts.factory.updateBinaryExpression(
    node,
    node.left,
    node.operatorToken,
    utils.visit(node.right)
  );
};
