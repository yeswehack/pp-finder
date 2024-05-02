import ts from "typescript";
import { PPTransformer } from "../types";
import { isInAssignation } from "./utils";

// x(y)
export const callExpressionTransformer: PPTransformer = (node, utils) => {
  // Check
  if (!ts.isCallExpression(node)) {
    return null;
  }

  let bindTarget;
  if (ts.isPropertyAccessExpression(node.expression)) {
    bindTarget = node.expression.expression;
  }
  if (ts.isElementAccessExpression(node.expression)) {
    bindTarget = node.expression.expression;
  }

  let func = utils.visit(node.expression);

  if (bindTarget) {
    func = ts.factory.createCallChain(
      ts.factory.createPropertyAccessChain(
        func,
        ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
        "bind"
      ),
      ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
      undefined,
      [bindTarget]
    );
  }

  const args = node.arguments.map(utils.visit);
  const newNode = utils.createWrapperCall("call", node.expression, func, ...args);

  return newNode;
};

export default callExpressionTransformer;
