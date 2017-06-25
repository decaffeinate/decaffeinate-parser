import { Block as CoffeeBlock } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Block } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapBlock from './mapBlock';

/**
 * Convert a CoffeeScript block node to a decaffeinate-parser Block node,
 * carefully handling the empty block case.
 *
 * Ideally, there wouldn't need to be any special cases here, but there are a
 * few things that add complexity for now.
 * - Both decaffeinate-parser and decaffeinate expect every AST node to contain
 *   at least one token. That means that a whitespace-only empty block will
 *   cause a crash.
 * - The CoffeeScript compiler seems to sometimes give incorrect location
 *   information for empty blocks, e.g. for empty class bodies.
 * - Blocks ending in semicolons need to sometimes have that semicolon removed
 *   (e.g. when the block is treated as an expression), so an empty block that
 *   is just a semicolon should become an actual empty block and not null.
 *
 * We convert a CoffeeScript empty block to a decaffeinate-parser empty block if
 * the block is only a semicolon or if the block only consists of comments. All
 * other empty blocks result in null.
 */
export default function mapPossiblyEmptyBlock(context: ParseContext, node: CoffeeBlock | null | undefined): Block | null {
  if (!node) {
    return null;
  }

  let lastSourceIndex = context.linesAndColumns.indexForLocation({
    line: node.locationData.last_line,
    column: node.locationData.last_column
  });
  if (lastSourceIndex === null) {
    throw new Error('Expected to find last source index of block.');
  }
  if (context.source[lastSourceIndex] === ';') {
    return mapBlock(context, node);
  }

  if (node.expressions.length === 0) {
    return null;
  }
  return mapBlock(context, node);
}
