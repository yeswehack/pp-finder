import arrowFunctionTransformer from "./arrowFunction";
import callExpressionTransformer from "./callExpression";
import elementAccessTransformer from "./elementAccess";
import expressionStatementTransformer from "./expressionStatement";
import forInStatementTransformer from "./forInStatement";
import functionDeclarationTransformer from "./functionDeclaration";
import functionExpressionTransformer from "./functionExpression";
import InExpressionTransformer from "./inExpression";
import objectLiteralTransformer from "./objectLiteral";
import propertyAccessTransformer from "./propertyAccess";
import variableDeclarationTransformer from "./variableDeclaration";

export const transformers = [
  elementAccessTransformer,
  expressionStatementTransformer,
  callExpressionTransformer,
  propertyAccessTransformer,
  variableDeclarationTransformer,
  objectLiteralTransformer,
  forInStatementTransformer,
  InExpressionTransformer,
  arrowFunctionTransformer,
  functionDeclarationTransformer,
  functionExpressionTransformer,
] as const;

export default transformers;
