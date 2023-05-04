import ts from "typescript";
import { PPTransformer } from "../types";
import { isInAssignation } from "./utils";

// x.y
export const propertyAccessTransformer: PPTransformer = (node, utils) => {
  // Check
  if (
    isInAssignation(node) ||
    !ts.isPropertyAccessExpression(node) ||
    node.expression.kind === ts.SyntaxKind.SuperKeyword
  ) {
    return null;
  }

  // Transform
  const newNode = utils.createWrapperCall("prop", node.name, [
    utils.visit(node.expression),
    ts.factory.createStringLiteral(node.name.text),
  ]);

  return ts.factory.updatePropertyAccessExpression(
    node,
    newNode,
    utils.visit(node.name)
  );
};

export default propertyAccessTransformer;
