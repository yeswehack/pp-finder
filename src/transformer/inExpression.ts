import ts from "typescript";
import { PPTransformer } from "../types";

// if (y in x)
export const InExpressionTransformer: PPTransformer = (node, utils) => {
  // Check
  if (
    !ts.isBinaryExpression(node) ||
    node.operatorToken.kind !== ts.SyntaxKind.InKeyword
  ) {
    return null;
  }

  if (ts.isPrivateIdentifier(node.left)) {
    return null;
  }

  // Transform
  return utils.createWrapperCall(
    "isIn",
    node.right,
    utils.visit(node.right),
    utils.visit(node.left)
  );
};

export default InExpressionTransformer;
