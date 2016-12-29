import { Undefined as CoffeeUndefined } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Undefined } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapBase from './mapBase';

export default function mapUndefined(context: ParseContext, node: CoffeeUndefined): Undefined {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  return new Undefined(line, column, start, end, raw, virtual);
}
