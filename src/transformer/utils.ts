import ts from "typescript";
import { PPTransformerUtils } from "../types";

function isAssignation(operator: ts.BinaryOperator): boolean {
  const assignationTokens = [
    /*    = */ ts.SyntaxKind.EqualsToken,
    /*   += */ ts.SyntaxKind.PlusEqualsToken,
    /*   -= */ ts.SyntaxKind.MinusEqualsToken,
    /*   *= */ ts.SyntaxKind.AsteriskEqualsToken,
    /*  **= */ ts.SyntaxKind.AsteriskAsteriskEqualsToken,
    /*   /= */ ts.SyntaxKind.SlashEqualsToken,
    /*   %= */ ts.SyntaxKind.PercentEqualsToken,
    /*  <<= */ ts.SyntaxKind.LessThanLessThanEqualsToken,
    /*  >>= */ ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
    /* >>>= */ ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    /*   &= */ ts.SyntaxKind.AmpersandEqualsToken,
    /*  &&= */ ts.SyntaxKind.AmpersandAmpersandEqualsToken,
    /*   |= */ ts.SyntaxKind.BarEqualsToken,
    /*  ||= */ ts.SyntaxKind.BarBarEqualsToken,
    /*  ??= */ ts.SyntaxKind.QuestionQuestionEqualsToken,
    /*   ^= */ ts.SyntaxKind.CaretEqualsToken,
  ];

  return assignationTokens.includes(operator);
}

export function isInAssignation(node: ts.Node): boolean {
  return (
    node.parent &&
    ts.isBinaryExpression(node.parent) &&
    isAssignation(node.parent.operatorToken.kind) &&
    node.parent.left == node
  );
}

export function* iterBindingPatternPath(
  node: ts.ObjectBindingPattern,
  path: ts.StringLiteral[] = []
): Generator<ts.ArrayLiteralExpression> {
  for (const elem of node.elements) {
    const x = ts.isShorthandPropertyAssignment(elem);

    if (!elem.propertyName) {
      if (ts.isIdentifier(elem.name)) {
        yield ts.factory.createArrayLiteralExpression([
          ...path,
          ts.factory.createStringLiteral(elem.name.text),
        ]);
      }
      continue;
    }

    if (ts.isIdentifier(elem.propertyName)) {
      if (ts.isIdentifier(elem.name)) {
        yield ts.factory.createArrayLiteralExpression([
          ...path,
          ts.factory.createStringLiteral(elem.propertyName.text),
        ]);
      }

      if (ts.isObjectBindingPattern(elem.name)) {
        yield* iterBindingPatternPath(elem.name, [
          ...path,
          ts.factory.createStringLiteral(elem.propertyName.getText()),
        ]);
      }
    }

    if (ts.isComputedPropertyName(elem.propertyName)) {
      yield ts.factory.createArrayLiteralExpression([
        ...path,
        elem.propertyName.expression,
      ]);
    }
  }
}

export function replaceParams(
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  utils: PPTransformerUtils
) {
  const newParameters: ts.ParameterDeclaration[] = [];
  const newDeclarations: ts.VariableDeclaration[] = [];

  for (const param of node.parameters) {
    if (ts.isObjectBindingPattern(param.name)) {
      const paths = Array.from(iterBindingPatternPath(param.name));

      const name = `${utils.wrapperName}_${newDeclarations.length}`;

      const identifier = ts.factory.createIdentifier(name);

      const newNode = utils.createWrapperCall("bind", param, [
        identifier,
        ts.factory.createArrayLiteralExpression(paths),
      ]);

      newDeclarations.push(
        ts.factory.createVariableDeclaration(
          param.name,
          undefined,
          undefined,
          newNode
        )
      );

      newParameters.push(
        ts.factory.updateParameterDeclaration(
          param,
          param.modifiers,
          param.dotDotDotToken,
          identifier,
          param.questionToken,
          param.type,
          param.initializer
        )
      );
    } else {
      newParameters.push(param);
    }
  }

  let newStatements: ts.Statement[] = [];
  if (newDeclarations.length !== 0) {
    newStatements.push(
      ts.factory.createVariableStatement(
        undefined,
        ts.factory.createVariableDeclarationList(
          newDeclarations,
          ts.NodeFlags.Let
        )
      )
    );
  }

  return { newParameters, newStatements };
}
