import ts from "typescript";
import { defineTransformer } from "./utils";

// if (y in x)
export default defineTransformer('inExpression', (node, utils) => {
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
  return utils.createPPFCall(
    "isIn",
    node.right,
    utils.visit(node.right),
    utils.visit(node.left)
  );
});
