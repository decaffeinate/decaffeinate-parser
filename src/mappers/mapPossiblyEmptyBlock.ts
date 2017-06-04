import { Block as CoffeeBlock } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Block } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapBlock from './mapBlock';

export default function mapPossiblyEmptyBlock(context: ParseContext, node: CoffeeBlock | null | undefined): Block | null {
  if (!node) {
    return null;
  }
  // Note that, for now, we intentionally consider blocks containing only
  // comments as non-empty, even though the statement array will have length 0.
  // A possible future cleanup is to make those empty as well, or to generate
  // nodes even for empty blocks.
  if (node.expressions.length === 0) {
    return null;
  }
  return mapBlock(context, node);
}
