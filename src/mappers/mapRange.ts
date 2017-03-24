import { Range as CoffeeRange } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { Range } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapRange(context: ParseContext, node: CoffeeRange): Range {
  let { line, column, start, end, raw } = mapBase(context, node);

  if (!node.from || !node.to) {
    throw new Error(`'from' or 'to' unexpectedly missing: ${inspect(node)}`);
  }

  return new Range(
    line, column, start, end, raw,
    mapAny(context, node.from),
    mapAny(context, node.to),
    !node.exclusive
  );
}
