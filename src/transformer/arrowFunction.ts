import ts from "typescript";
import { defineTransformer, replaceParams } from "./utils";


//  (({y}) => ())(x)
export default defineTransformer('arrowFunction', (node, utils) => {
  // Check
  if (
    !ts.isArrowFunction(node) ||
    node.body === undefined ||
    node.parameters.length === 0
  ) {
    return null;
  }

  // Transform
  const { newParameters, newStatements } = replaceParams(node, utils);

  let oldStatements: ts.Statement[] = [];
  const oldBody = utils.visit(node.body);
  if (ts.isBlock(oldBody)) {
    oldStatements.push(...oldBody.statements);
  } else {
    oldStatements.push(ts.factory.createReturnStatement(oldBody));
  }

  return ts.factory.updateArrowFunction(
    node,
    node.modifiers,
    node.typeParameters,
    newParameters,
    node.type,
    node.equalsGreaterThanToken,
    ts.factory.createBlock([...newStatements, ...oldStatements])
  );
});
