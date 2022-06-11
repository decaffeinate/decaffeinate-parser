import { Range as CoffeeRange } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes.js';
import { inspect } from 'util';
import { Range } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapRange(
  context: ParseContext,
  node: CoffeeRange
): Range {
  const { line, column, start, end, raw } = getLocation(context, node);

  if (!node.from || !node.to) {
    throw new Error(`'from' or 'to' unexpectedly missing: ${inspect(node)}`);
  }

  return new Range(
    line,
    column,
    start,
    end,
    raw,
    mapAny(context, node.from),
    mapAny(context, node.to),
    !node.exclusive
  );
}
