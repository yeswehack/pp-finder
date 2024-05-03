import ts from "typescript";
import { defineTransformer, isInAssignation } from "./utils";

// x.y
export default defineTransformer((node, utils) => {
  // Check
  if (
    isInAssignation(node) ||
    !ts.isPropertyAccessExpression(node) ||
    node.expression.kind === ts.SyntaxKind.SuperKeyword
  ) {
    return null;
  }

  // Transform
  const newNode = utils.createPPFCall(
    "prop",
    node.name,
    utils.visit(node.expression),
    ts.factory.createStringLiteral(node.name.text)
  );

  return ts.factory.updatePropertyAccessExpression(
    node,
    newNode,
    utils.visit(node.name)
  );
});
