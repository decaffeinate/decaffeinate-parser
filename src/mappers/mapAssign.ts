import { Assign } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { AssignOp } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapAssign(context: ParseContext, node: Assign): AssignOp {
  if (node.context === 'object' || (node.context && node.context.slice(-1) === '=')) {
    throw new UnsupportedNodeError(node);
  }

  let { line, column, start, end, raw } = mapBase(context, node);

  return new AssignOp(
    line, column, start, end, raw,
    mapAny(context, node.variable),
    mapAny(context, node.value)
  );
}
