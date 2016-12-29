import { Null as CoffeeNull } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Null } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapBase from './mapBase';

export default function mapNull(context: ParseContext, node: CoffeeNull): Null {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  return new Null(line, column, start, end, raw, virtual);
}
