import { Bool as CoffeeBool } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Bool } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapBase from './mapBase';

export default function mapBool(context: ParseContext, node: CoffeeBool): Bool {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  return new Bool(line, column, start, end, raw, virtual, JSON.parse(node.val));
}
