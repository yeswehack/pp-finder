import ts from "typescript";
import { PPTransformer } from "../types";
import { isInAssignation } from "./utils";

export function doRequireBind(node: ts.ElementAccessExpression) {
  if (ts.isCallExpression(node.parent)) {
    return !node.parent.arguments.some((x) => x === node);
  }
  return false;
}

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

  if (
    ts.isPostfixUnaryExpression(node.parent) ||
    ts.isPrefixUnaryExpression(node.parent)
  ) {
    return node;
  }
  const requireBind = doRequireBind(node);

  // TODO: Implement a better check than this, this is just a quick fix
  const isAsync = node.getText().includes("await");

  const k = ts.factory.createIdentifier(utils.wrapperName + "k");
  const v = ts.factory.createIdentifier(utils.wrapperName + "v");

  const nextgen = ts.factory.createParenthesizedExpression(
    ts.factory.createCallExpression(
      ts.factory.createParenthesizedExpression(
        ts.factory.createArrowFunction(
          isAsync
            ? [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)]
            : [],
          undefined,
          [],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createBlock(
            [
              ts.factory.createVariableStatement(
                undefined,
                ts.factory.createVariableDeclarationList(
                  [
                    ts.factory.createVariableDeclaration(
                      k,
                      undefined,
                      undefined,
                      node.expression
                    ),
                  ],
                  ts.NodeFlags.Const
                )
              ),
              ts.factory.createVariableStatement(
                undefined,
                ts.factory.createVariableDeclarationList(
                  [
                    ts.factory.createVariableDeclaration(
                      v,
                      undefined,
                      undefined,
                      node.argumentExpression
                    ),
                  ],
                  ts.NodeFlags.Const
                )
              ),
              ts.factory.createExpressionStatement(
                utils.createWrapperCall("elem", node.argumentExpression, [k, v])
              ),
              ts.factory.createReturnStatement(
                requireBind
                  ? ts.factory.createCallExpression(
                      ts.factory.createPropertyAccessExpression(
                        ts.factory.createElementAccessExpression(k, v),
                        ts.factory.createIdentifier("bind")
                      ),
                      undefined,
                      [k]
                    )
                  : ts.factory.createElementAccessExpression(k, v)
              ),
            ],
            true
          )
        )
      ),
      undefined,
      []
    )
  );

  if (isAsync) {
    return ts.factory.createAwaitExpression(nextgen);
  }

  return nextgen;
};

export default elementAccessTransformer;
