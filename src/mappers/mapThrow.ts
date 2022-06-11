import { Throw as CoffeeThrow } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes.js';
import { Throw } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapThrow(
  context: ParseContext,
  node: CoffeeThrow
): Throw {
  const { line, column, start, end, raw } = getLocation(context, node);
  const expression = node.expression ? mapAny(context, node.expression) : null;
  return new Throw(line, column, start, end, raw, expression);
}
