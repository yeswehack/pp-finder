import ts, { factory as f } from "typescript";
import { PPTransformer } from "../types";

export const throwStatementTransformer: PPTransformer = (node, utils) => {
  if (!ts.isThrowStatement(node)) {
    return null;
  }

  const newNode = utils.visit(node.expression);

  return f.createThrowStatement(
    f.createParenthesizedExpression(
      f.createBinaryExpression(
        f.createElementAccessChain(
          newNode,
          f.createToken(ts.SyntaxKind.QuestionDotToken),
          f.createPropertyAccessExpression(
            f.createIdentifier(utils.wrapperName),
            f.createIdentifier("s")
          )
        ),
        f.createToken(ts.SyntaxKind.QuestionQuestionToken),
        newNode
      )
    )
  );
};
