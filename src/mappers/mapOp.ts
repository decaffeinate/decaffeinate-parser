import { Op as CoffeeOp, Return as CoffeeReturn } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { MultiplyOp, Node, Op, SubtractOp, UnaryNegateOp, Yield, YieldFrom, YieldReturn } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapOp(context: ParseContext, node: CoffeeOp): Node {
  switch (node.operator) {
    case '-':
      return mapSubtractOp(context, node);

    case '*':
      return mapMultiplyOp(context, node);

    case 'yield':
      return mapYieldOp(context, node);

    case 'yield*':
      return mapYieldFromOp(context, node);
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

function mapYieldOp(context: ParseContext, node: CoffeeOp) {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  if (node.first instanceof CoffeeReturn) {
    let expression = node.first.expression;
    return new YieldReturn(
      line, column, start, end, raw, virtual,
      expression ? mapAny(context, expression) : null,
    );
  } else {
    return new Yield(
      line, column, start, end, raw, virtual,
      mapAny(context, node.first)
    );
  }
}

function mapYieldFromOp(context: ParseContext, node: CoffeeOp) {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  return new YieldFrom(
    line, column, start, end, raw, virtual,
    mapAny(context, node.first)
  );
}
