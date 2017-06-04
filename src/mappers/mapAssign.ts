import { Assign } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { AssignOp, BaseAssignOp, BitAndOp, BitOrOp, BitXorOp, CompoundAssignOp, DivideOp, ExistsOp, ExpOp, FloorDivideOp, LeftShiftOp, LogicalAndOp, LogicalOrOp, ModuloOp, MultiplyOp, PlusOp, RemOp, SignedRightShiftOp, SubtractOp, UnsignedRightShiftOp } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

const COMPOUND_ASSIGN_OPS = {
  '-=': SubtractOp.name,
  '+=': PlusOp.name,
  '/=': DivideOp.name,
  '*=': MultiplyOp.name,
  '%=': RemOp.name,
  '||=': LogicalOrOp.name,
  '&&=': LogicalAndOp.name,
  '?=': ExistsOp.name,
  '<<=': LeftShiftOp.name,
  '>>=': SignedRightShiftOp.name,
  '>>>=': UnsignedRightShiftOp.name,
  '&=': BitAndOp.name,
  '^=': BitXorOp.name,
  '|=': BitOrOp.name,
  '**=': ExpOp.name,
  '//=': FloorDivideOp.name,
  '%%=': ModuloOp.name,
};

export default function mapAssign(context: ParseContext, node: Assign): BaseAssignOp {
  if (node.context === 'object') {
    throw new UnsupportedNodeError(node, 'Unexpected object context when mapping regular assign op.');
  }

  let { line, column, start, end, raw } = mapBase(context, node);
  if (node.context) {
    let opName = COMPOUND_ASSIGN_OPS[node.context];
    if (!opName) {
      throw new UnsupportedNodeError(node, 'Unexpected operator context for assign op.');
    }
    return new CompoundAssignOp(
      line, column, start, end, raw,
      mapAny(context, node.variable),
      mapAny(context, node.value),
      opName
    );
  } else {
    return new AssignOp(
      line, column, start, end, raw,
      mapAny(context, node.variable),
      mapAny(context, node.value)
    );
  }
}
