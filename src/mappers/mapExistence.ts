import { Existence } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { UnaryExistsOp } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapExistence(context: ParseContext, node: Existence): UnaryExistsOp {
  let { line, column, start, end, raw } = getLocation(context, node);
  return new UnaryExistsOp(line, column, start, end, raw, mapAny(context, node.expression));
}
