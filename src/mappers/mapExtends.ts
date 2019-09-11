import { Extends } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { ExtendsOp } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapExtends(context: ParseContext, node: Extends): ExtendsOp {
  const { line, column, start, end, raw } = getLocation(context, node);
  return new ExtendsOp(
    line, column, start, end, raw,
    mapAny(context, node.child),
    mapAny(context, node.parent)
  );
}
