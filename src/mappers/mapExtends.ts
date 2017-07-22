import { Extends } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { ExtendsOp } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapExtends(context: ParseContext, node: Extends): ExtendsOp {
  let { line, column, start, end, raw } = getLocation(context, node);
  return new ExtendsOp(
    line, column, start, end, raw,
    mapAny(context, node.child),
    mapAny(context, node.parent)
  );
}
