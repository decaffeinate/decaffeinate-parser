import { Undefined as CoffeeUndefined } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Undefined } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';

export default function mapUndefined(context: ParseContext, node: CoffeeUndefined): Undefined {
  let { line, column, start, end, raw } = getLocation(context, node);
  return new Undefined(line, column, start, end, raw);
}
