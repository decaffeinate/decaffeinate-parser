import { Null as CoffeeNull } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Null } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';

export default function mapNull(context: ParseContext, node: CoffeeNull): Null {
  let { line, column, start, end, raw } = getLocation(context, node);
  return new Null(line, column, start, end, raw);
}
