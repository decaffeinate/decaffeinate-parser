import lex from 'coffee-lex';
import * as CoffeeScript from 'decaffeinate-coffeescript';
import { patchCoffeeScript } from './ext/coffee-script';
import mapProgram from './mappers/mapProgram';
import { Node, Program } from './nodes';
import fixLocations from './util/fixLocations';
import ParseContext from './util/ParseContext';

export function parse(source: string): Program {
  patchCoffeeScript();
  let context = ParseContext.fromSource(source, lex, CoffeeScript.nodes);
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
