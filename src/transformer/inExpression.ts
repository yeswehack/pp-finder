import ts from "typescript";
import { PPTransformer } from "../types";

/**
 * TODO: FIXME:
 * // We don't handle this
 * get name() {
 *   if (!this || !(#name in this)) { // transforms to !(ø.isIn(this, #name, [67, 29])) which is not valid javascript
 *     throw new ERR_INVALID_THIS('File');
 *   }
 *
 *   return this.#name;
 * }
 */

// if (y in x)
export const InExpressionTransformer: PPTransformer = (node, utils) => {
  // Check
  if (!ts.isBinaryExpression(node) || node.operatorToken.kind !== ts.SyntaxKind.InKeyword) {
    return null;
  }

  // Transform
  return utils.createWrapperCall(
    "isIn",
    node.right,
    utils.visit(node.right),
    utils.visit(node.left)
  );
};

export default InExpressionTransformer;
