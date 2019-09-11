import { SourceType } from 'coffee-lex';
import {
  Base,
  Call,
  Literal,
  Value
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import ParseContext from './ParseContext';

/**
 * Determine if the given CoffeeScript AST node is an interpolated heregex node
 * that's pretending to be a function call to the RegExp function.
 */
export default function isHeregexTemplateNode(
  node: Base,
  context: ParseContext
): boolean {
  if (
    !(node instanceof Call) ||
    !node.variable ||
    !(node.variable instanceof Value) ||
    !node.variable.base ||
    !(node.variable.base instanceof Literal) ||
    node.variable.base.value !== 'RegExp'
  ) {
    return false;
  }
  const { sourceTokens, linesAndColumns } = context;
  const start = linesAndColumns.indexForLocation({
    line: node.locationData.first_line,
    column: node.locationData.first_column
  });
  if (start === null) {
    return false;
  }
  const startTokenIndex = sourceTokens.indexOfTokenContainingSourceIndex(start);
  if (startTokenIndex === null) {
    return false;
  }
  const startToken = sourceTokens.tokenAtIndex(startTokenIndex);
  if (startToken === null) {
    return false;
  }
  return startToken.type === SourceType.HEREGEXP_START;
}
