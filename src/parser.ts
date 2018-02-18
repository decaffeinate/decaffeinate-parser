import lex from 'coffee-lex';
import { patchCoffeeScript } from './ext/coffee-script';
import mapProgram from './mappers/mapProgram';
import { Node, Program } from './nodes';
import parseCS1AsCS2 from './parseCS1AsCS2';
import fixLocations from './util/fixLocations';
import ParseContext from './util/ParseContext';

export function parse(source: string): Program {
  patchCoffeeScript();
  let context = ParseContext.fromSource(source, lex, parseCS1AsCS2);
  fixLocations(context, context.ast);
  let program = mapProgram(context);
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
    let shouldDescend = callback(currentNode, currentParent);
    if (shouldDescend !== false) {
      for (let child of currentNode.getChildren()) {
        traverseRec(child, currentNode);
      }
    }
  }
  traverseRec(node, null);
}
