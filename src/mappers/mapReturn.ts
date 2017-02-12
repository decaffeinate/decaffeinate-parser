import { Return as CoffeeReturn } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Return } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapReturn(context: ParseContext, node: CoffeeReturn): Return {
  let { line, column, start, end, raw } = mapBase(context, node);
  let argument = node.expression ? mapAny(context, node.expression) : null;
  return new Return(line, column, start, end, raw, argument);
}
