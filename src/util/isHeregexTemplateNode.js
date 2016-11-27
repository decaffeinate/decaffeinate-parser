import { HEREGEXP_START } from 'coffee-lex';

import type from './type.js';

/**
 * Determine if the given CoffeeScript AST node is an interpolated heregex node
 * that's pretending to be a function call to the RegExp function.
 */
export default function isHeregexTemplateNode(node, context) {
  if (type(node) !== 'Call' ||
      !node.variable ||
      type(node.variable) !== 'Value' ||
      !node.variable.base ||
      type(node.variable.base) !== 'Literal' ||
      node.variable.base.value !== 'RegExp') {
    return false;
  }
  let { sourceTokens, linesAndColumns } = context;
  let start = linesAndColumns.indexForLocation({ line: node.locationData.first_line, column: node.locationData.first_column });
  let startTokenIndex = sourceTokens.indexOfTokenContainingSourceIndex(start);
  if (startTokenIndex === null) {
    return false;
  }
  return sourceTokens.tokenAtIndex(startTokenIndex).type === HEREGEXP_START;
}
