import { Throw as CoffeeThrow } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Throw } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapThrow(context: ParseContext, node: CoffeeThrow): Throw {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  let expression = node.expression ? mapAny(context, node.expression) : null;
  return new Throw(line, column, start, end, raw, virtual, expression);
}
