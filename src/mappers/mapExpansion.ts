import { Expansion as CoffeeExpansion } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Expansion } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';

export default function mapExpansion(context: ParseContext, node: CoffeeExpansion): Expansion {
  let { line, column, start, end, raw } = getLocation(context, node);
  return new Expansion(line, column, start, end, raw);
}
