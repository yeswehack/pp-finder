import ts from "typescript";
import { defineTransformer } from "./utils";

// ({y} = x);
export default defineTransformer('objectLiteral', (node, utils) => {
  // Check
  if (
    !ts.isBinaryExpression(node) ||
    node.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
    !ts.isObjectLiteralExpression(node.left)
  ) {
    return null;
  }

  // Transform
  function* iterPaths(
    node: ts.ObjectLiteralExpression,
    path: ts.StringLiteral[] = []
  ): Generator<ts.ArrayLiteralExpression> {
    for (const prop of node.properties) {
      if (ts.isShorthandPropertyAssignment(prop)) {
        yield ts.factory.createArrayLiteralExpression([
          ...path,
          ts.factory.createStringLiteral(prop.name.text),
        ]);
      }

      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        if (ts.isIdentifier(prop.initializer)) {
          yield ts.factory.createArrayLiteralExpression([
            ...path,
            ts.factory.createStringLiteral(prop.name.text),
          ]);
        }

        if (ts.isObjectLiteralExpression(prop.initializer)) {
          yield* iterPaths(prop.initializer, [
            ...path,
            ts.factory.createStringLiteral(prop.name.text),
          ]);
        }
      }

      if (
        ts.isPropertyAssignment(prop) &&
        ts.isComputedPropertyName(prop.name)
      ) {
        yield ts.factory.createArrayLiteralExpression([
          ...path,
          prop.name.expression,
        ]);
      }
    }
  }

  const paths = Array.from(iterPaths(node.left));

  const newNode = utils.createPPFCall(
    "bind",
    node.right,
    utils.visit(node.right),
    ts.factory.createArrayLiteralExpression(paths)
  );

  return ts.factory.updateBinaryExpression(
    node,
    utils.visit(node.left),
    node.operatorToken,
    newNode
  );
});
