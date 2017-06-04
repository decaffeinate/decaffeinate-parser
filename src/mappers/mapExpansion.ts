import { Expansion as CoffeeExpansion } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Expansion } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapBase from './mapBase';

export default function mapExpansion(context: ParseContext, node: CoffeeExpansion): Expansion {
  let { line, column, start, end, raw } = mapBase(context, node);
  return new Expansion(line, column, start, end, raw);
}
