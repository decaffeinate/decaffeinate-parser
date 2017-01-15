import { Op as CoffeeOp } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { MultiplyOp, Op, SubtractOp, UnaryNegateOp } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapOp(context: ParseContext, node: CoffeeOp): Op {
  switch (node.operator) {
    case '-':
      return mapSubtractOp(context, node);

    case '*':
      return mapMultiplyOp(context, node);
  }

  throw new UnsupportedNodeError(node);
}

function mapSubtractOp(context: ParseContext, node: CoffeeOp): Op {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  if (node.second) {
    return new SubtractOp(
      line, column, start, end, raw, virtual,
      mapAny(context, node.first),
      mapAny(context, node.second)
    );
  } else {
    return new UnaryNegateOp(
      line, column, start, end, raw, virtual,
      mapAny(context, node.first)
    );
  }
}

function mapMultiplyOp(context: ParseContext, node: CoffeeOp) {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  if (!node.second) {
    throw new Error(`unexpected '*' operator with only one operand: ${inspect(node)}`);
  }

  return new MultiplyOp(
    line, column, start, end, raw, virtual,
    mapAny(context, node.first),
    mapAny(context, node.second)
  );
}
