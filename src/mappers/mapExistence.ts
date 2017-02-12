import { Existence } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { UnaryExistsOp } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapExistence(context: ParseContext, node: Existence): UnaryExistsOp {
  let { line, column, start, end, raw } = mapBase(context, node);
  return new UnaryExistsOp(line, column, start, end, raw, mapAny(context, node.expression));
}
