import ts from "typescript";
import { PPFConfig } from "./config";
import { transformers } from "./transformer";
import { PPTransformerUtils } from "./transformer/utils";

export function compile(context: PPFConfig, source: string) {
  if (source.startsWith("#!")) {
    source = "//" + source;
  }
  const tree = ts.createSourceFile(
    "",
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS
  );

  const printer = ts.createPrinter();
  const transformer: ts.TransformerFactory<ts.SourceFile> = (ctx) => {
    const utils: PPTransformerUtils = {
      config: context,
      visit<T extends ts.Node>(node: T) {
        return ts.visitNode<T>(node, visit);
      },
      createPPFCall(name, target, ...params) {
        const pos = ts.getLineAndCharacterOfPosition(tree, target.getStart());
        const posArray = ts.factory.createArrayLiteralExpression([
          ts.factory.createNumericLiteral(pos.line + 1),
          ts.factory.createNumericLiteral(pos.character + 1),
        ]);

        return ts.factory.createCallExpression(
          ts.factory.createIdentifier(`${context.wrapperName}.${name}`),
          undefined,
          [posArray, ...params]
        );
      },
    };

    const visit: ts.Visitor = (node) => {
      for (const transformer of transformers) {
        if (!context.transformers.includes(transformer.name)) continue;
        const newNode = transformer.func(node, utils);
        if (newNode) {
          return newNode;
        }
      }

      return ts.visitEachChild(node, visit, ctx);
    };

    return (node) => ts.visitNode(node, visit);
  };

  const transformedTree = ts.transform(tree, [transformer]);

  const code = transformedTree.transformed.map((n) => printer.printFile(n));

  return code.join("\n");
}
