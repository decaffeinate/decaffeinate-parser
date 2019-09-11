import lex from 'coffee-lex';
import { patchCoffeeScript } from './ext/coffee-script';
import mapProgram from './mappers/mapProgram';
import { Node, Program } from './nodes';
import parseCS1AsCS2 from './parseCS1AsCS2';
import parseCS2 from './parseCS2';
import fixLocations from './util/fixLocations';
import ParseContext from './util/ParseContext';
import SourceTokenList from 'coffee-lex/dist/SourceTokenList';

export type Options = {
  useCS2: boolean;
};

export const DEFAULT_OPTIONS: Options = {
  useCS2: false
};

export function parse(
  source: string,
  options: Options = DEFAULT_OPTIONS
): Program {
  patchCoffeeScript();
  const parse = options.useCS2 ? parseCS2 : parseCS1AsCS2;
  const sourceLex = (s: string): SourceTokenList =>
    lex(s, { useCS2: options.useCS2 });
  const context = ParseContext.fromSource(source, sourceLex, parse);
  fixLocations(context, context.ast);
  const program = mapProgram(context);
  traverse(program, (node, parent) => {
    node.parentNode = parent;
  });
  return program;
}

export function traverse(
  node: Node,
  callback: (node: Node, parent: Node | null) => boolean | void
): void {
  function traverseRec(currentNode: Node, currentParent: Node | null): void {
    const shouldDescend = callback(currentNode, currentParent);
    if (shouldDescend !== false) {
      for (const child of currentNode.getChildren()) {
        traverseRec(child, currentNode);
      }
    }
  }
  traverseRec(node, null);
}
