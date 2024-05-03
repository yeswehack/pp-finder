import ts from "typescript";
import { defineTransformer, isInAssignation } from "./utils";

// x[y]
export default defineTransformer((node, utils) => {
  // Check
  if (
    isInAssignation(node) ||
    !ts.isElementAccessExpression(node) ||
    node.expression.kind === ts.SyntaxKind.SuperKeyword
  ) {
    return null;
  }

  if (
    ts.isPostfixUnaryExpression(node.parent) ||
    ts.isPrefixUnaryExpression(node.parent)
  ) {
    return node;
  }

  const key = ts.factory.createStringLiteral(
    Math.random().toString(36).slice(2)
  );

  const newNode = utils.createPPFCall(
    "elemProp",
    node.expression,
    key,
    utils.visit(node.expression)
  );
  const newArg = utils.createPPFCall(
    "elemKey",
    node.argumentExpression,
    key,
    utils.visit(node.argumentExpression)
  );

  return ts.factory.updateElementAccessExpression(node, newNode, newArg);
});
