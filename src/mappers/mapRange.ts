import { Range as CoffeeRange } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Range } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapRange(context: ParseContext, node: CoffeeRange): Range {
  let { line, column, start, end, raw } = mapBase(context, node);

  return new Range(
    line, column, start, end, raw,
    mapAny(context, node.from),
    mapAny(context, node.to),
    !node.exclusive
  );
}
