import fs from "fs";
import path from "path";
import ts from "typescript";
import { transformers } from "./transformer";
import { Compiler, PPArgs, PPTransformerUtils } from "./types";

interface CreateCompilerOpts {
  minimal: boolean;
  wrapperName: string;
  inline: boolean;
}

export function createCompiler({
  minimal,
  wrapperName,
  inline,
}: CreateCompilerOpts): Compiler {
  const module = minimal ? "minimal" : "classic";

  const modulePath = path.join(
    path.dirname(__filename),
    "agent",
    `index.${module}.js`
  );
  const moduleContent = fs.readFileSync(modulePath, "utf8");

  function compile(filename: string, source: string) {
    const tree = ts.createSourceFile(
      "",
      source,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.JS
    );

    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      const utils: PPTransformerUtils = {
        wrapperName: wrapperName,
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

    const printer = ts.createPrinter();

    let prefix = "";

    if (inline) {
      prefix = `const ${wrapperName} = ((() => { const exports = {}; ${moduleContent} ; exports.ppFinder = ppFinder; return exports; })()).ppFinder(${JSON.stringify(
        filename
      )});\n`;
    } else {
      prefix = `const ${wrapperName} = require("pp-finder").ppFinder(${JSON.stringify(
        filename
      )});\n`;
    }

    const transformedTree = ts.transform(tree, [transformer]);
    const code = transformedTree.transformed.map((n) => printer.printFile(n));
    return prefix + code.join("\n");
  }

  return {
    compile,
  };
}
