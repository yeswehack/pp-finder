import ts from "typescript";
import { PPTransformer } from "../types";
import { isInAssignation } from "./utils";

// x[y]
export const elementAccessTransformer: PPTransformer = (node, utils) => {
  // Check
  if (
    isInAssignation(node) ||
    !ts.isElementAccessExpression(node) ||
    node.expression.kind === ts.SyntaxKind.SuperKeyword
  ) {
    return null;
  }

  if (ts.isPostfixUnaryExpression(node.parent) || ts.isPrefixUnaryExpression(node.parent)) {
    return node;
  }

  const key = ts.factory.createStringLiteral(Math.random().toString(36).slice(2));

  const newNode = utils.createWrapperCall(
    "elem_prop",
    node.expression,
    utils.visit(node.expression),
    key
  );
  const newArg = utils.createWrapperCall(
    "elem_key",
    node.argumentExpression,
    utils.visit(node.argumentExpression),
    key
  );

  return ts.factory.updateElementAccessExpression(node, newNode, newArg);
};

export default elementAccessTransformer;
