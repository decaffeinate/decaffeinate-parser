import { SourceType } from 'coffee-lex';
import { Base, Call, Literal, Value } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import ParseContext from './ParseContext';

/**
 * Determine if the given CoffeeScript AST node is an interpolated heregex node
 * that's pretending to be a function call to the RegExp function.
 */
export default function isHeregexTemplateNode(node: Base, context: ParseContext): boolean {
  if (!(node instanceof Call) ||
      !node.variable ||
      !(node.variable instanceof Value) ||
      !node.variable.base ||
      !(node.variable.base instanceof Literal) ||
      node.variable.base.value !== 'RegExp') {
    return false;
  }
  let { sourceTokens, linesAndColumns } = context;
  let start = linesAndColumns.indexForLocation({ line: node.locationData.first_line, column: node.locationData.first_column });
  if (start === null) {
    return false;
  }
  let startTokenIndex = sourceTokens.indexOfTokenContainingSourceIndex(start);
  if (startTokenIndex === null) {
    return false;
  }
  let startToken = sourceTokens.tokenAtIndex(startTokenIndex);
  if (startToken === null) {
    return false;
  }
  return startToken.type === SourceType.HEREGEXP_START;
}
