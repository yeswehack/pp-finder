import ts from "typescript";
import { defineTransformer, replaceParams } from "./utils";

// function f({y}) {}
export default defineTransformer((node, utils) => {
  // Check
  if (
    !ts.isFunctionDeclaration(node) ||
    node.body === undefined ||
    node.parameters.length === 0
  ) {
    return null;
  }

  // Transform
  const { newParameters, newStatements } = replaceParams(node, utils);

  return ts.factory.updateFunctionDeclaration(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.typeParameters,
    newParameters,
    node.type,
    ts.factory.createBlock([
      ...newStatements,
      ...utils.visit(node.body).statements,
    ])
  );
});
