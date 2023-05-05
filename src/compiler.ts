import ts from "typescript";
import Cache from './cache';
import { transformers } from "./transformer";
import { PPFinderConfig, PPTransformerUtils } from "./types";

export function compile(config: PPFinderConfig, filename: string, source: string) {
  const { wrapperName } = config;

  if (source.startsWith("#!")) {
    source = "//" + source;
  }

  const cache = new Cache(config);

  if (config.useCache) {
    const found = cache.get(source);
    if (found) return found;
  }

  const tree = ts.createSourceFile(
    "",
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS
  );

  const printer = ts.createPrinter();
  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const utils: PPTransformerUtils = {
      wrapperName,
      visit<T extends ts.Node>(node: T) {
        return ts.visitNode<T>(node, visit);
      },
      createWrapperCall(name, target, params) {
        const pos = ts.getLineAndCharacterOfPosition(tree, target.getStart());
        const posArray = ts.factory.createArrayLiteralExpression([
          ts.factory.createNumericLiteral(pos.line + 1),
          ts.factory.createNumericLiteral(pos.character + 1),
        ]);

        return ts.factory.createCallExpression(
          ts.factory.createIdentifier(`${this.wrapperName}.${name}`),
          undefined,
          [...params, posArray]
        );
      },
    };

    const visit: ts.Visitor = (node) => {
      for (const transformer of transformers) {
        const newNode = transformer(node, utils);
        if (newNode) {
          return newNode;
        }
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (node) => ts.visitNode(node, visit);
  };

  const transformedTree = ts.transform(tree, [transformer]);

  const prefix = `const ${wrapperName} = globalThis.${wrapperName}Create('${filename}'); `;
  const code = transformedTree.transformed.map((n) => printer.printFile(n));

  const compiledSource = prefix + code.join("\n");

  if (config.useCache) {
    cache.store(source, compiledSource);
  }

  return compiledSource
}
