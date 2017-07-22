import { Bool as CoffeeBool } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Bool } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';

export default function mapBool(context: ParseContext, node: CoffeeBool): Bool {
  let { line, column, start, end, raw } = getLocation(context, node);
  return new Bool(line, column, start, end, raw, JSON.parse(node.val));
}
