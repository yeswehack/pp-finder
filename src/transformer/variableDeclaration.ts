import ts from "typescript";
import { PPTransformer } from "../types";
import { iterBindingPatternPath } from "./utils";

// const {y} = x;
export const variableDeclarationTransformer: PPTransformer = (node, utils) => {
  // Check
  if (
    !ts.isVariableDeclaration(node) ||
    !ts.isObjectBindingPattern(node.name) ||
    node.initializer === undefined
  ) {
    return null;
  }

  // Transform
  const paths = Array.from(iterBindingPatternPath(node.name));
  const newNode = utils.createWrapperCall(
    "bind",
    node.initializer,
    utils.visit(node.initializer),
    ts.factory.createArrayLiteralExpression(paths)
  );

  return ts.factory.updateVariableDeclaration(
    node,
    utils.visit(node.name),
    node.exclamationToken,
    node.type,
    newNode
  );
};
export default variableDeclarationTransformer;
