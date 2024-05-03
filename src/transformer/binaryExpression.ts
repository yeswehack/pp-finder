import ts from "typescript";
import { defineTransformer } from "./utils";

export default defineTransformer((node, utils) => {
  if (!ts.isBinaryExpression(node)) {
    return null;
  }

  return ts.factory.updateBinaryExpression(
    node,
    node.left,
    node.operatorToken,
    utils.visit(node.right)
  );
});
