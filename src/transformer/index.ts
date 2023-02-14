import arrowFunctionTransformer from "./arrowFunction";
import elementAccessTransformer from "./elementAccess";
import forInStatementTransformer from "./forInStatement";
import functionDeclarationTransformer from "./functionDeclaration";
import functionExpressionTransformer from "./functionExpression";
import InExpressionTransformer from "./inExpression";
import objectLiteralTransformer from "./objectLiteral";
import propertyAccessTransformer from "./propertyAccess";
import variableDeclarationTransformer from "./variableDeclaration";

export const transformers = [
  elementAccessTransformer,
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
