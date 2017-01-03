import { Extends } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { ExtendsOp } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapExtends(context: ParseContext, node: Extends): ExtendsOp {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  return new ExtendsOp(
    line, column, start, end, raw, virtual,
    mapAny(context, node.child),
    mapAny(context, node.parent)
  );
}
