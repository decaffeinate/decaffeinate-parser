import { Op as CoffeeOp, Return as CoffeeReturn } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import {
  BinaryOp, ChainedComparisonOp, EQOp, MultiplyOp, Node, Op, OperatorInfo, SubtractOp, UnaryNegateOp, UnaryOp, Yield,
  YieldFrom, YieldReturn
} from '../nodes';
import getOperatorInfoInRange from '../util/getOperatorInfoInRange';
import isChainedComparison from '../util/isChainedComparison';
import ParseContext from '../util/ParseContext';
import unwindChainedComparison from '../util/unwindChainedComparison';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapOp(context: ParseContext, node: CoffeeOp): Node {
  if (isChainedComparison(node)) {
    return mapChainedComparisonOp(context, node);
  } else {
    return mapOpWithoutChainedComparison(context, node);
  }
}

function mapChainedComparisonOp(context: ParseContext, node: CoffeeOp) {
  let { line, column, start, end, raw } = mapBase(context, node);
  let coffeeOperands = unwindChainedComparison(node);
  let operands = coffeeOperands.map(operand => mapAny(context, operand));
  let operators: Array<OperatorInfo> = [];

  for (let i = 0; i < operands.length - 1; i++) {
    let left = operands[i];
    let right = operands[i + 1];

    operators.push(getOperatorInfoInRange(context, left.end - 1, right.start));
  }

  return new ChainedComparisonOp(
    line,
    column,
    start,
    end,
    raw,
    operands,
    operators
  );
}

function mapOpWithoutChainedComparison(context: ParseContext, node: CoffeeOp): Node {
  switch (node.operator) {
    case '===':
      return mapBinaryOp(context, node, EQOp);

    case '-':
      return mapBinaryOrUnaryOp(context, node, SubtractOp, UnaryNegateOp);

    case '*':
      return mapBinaryOp(context, node, MultiplyOp);

    case 'yield':
      return mapYieldOp(context, node);

    case 'yield*':
      return mapUnaryOp(context, node, YieldFrom);
  }

  throw new UnsupportedNodeError(node);
}

function mapYieldOp(context: ParseContext, node: CoffeeOp): YieldReturn | Yield {
  let { line, column, start, end, raw } = mapBase(context, node);

  if (node.first instanceof CoffeeReturn) {
    let expression = node.first.expression;
    return new YieldReturn(
      line, column, start, end, raw,
      expression ? mapAny(context, expression) : null,
    );
  } else {
    return new Yield(
      line, column, start, end, raw,
      mapAny(context, node.first)
    );
  }
}

interface IBinaryOp {
  new(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ): BinaryOp;
}

function mapBinaryOp<T extends IBinaryOp>(context: ParseContext, node: CoffeeOp, Op: T): BinaryOp {
  let { line, column, start, end, raw } = mapBase(context, node);

  if (!node.second) {
    throw new Error(`unexpected '${node.operator}' operator with only one operand: ${inspect(node)}`);
  }

  return new Op(
    line, column, start, end, raw,
    mapAny(context, node.first),
    mapAny(context, node.second)
  );
}

interface IUnaryOp {
  new(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ): UnaryOp;
}

function mapUnaryOp<T extends IUnaryOp>(context: ParseContext, node: CoffeeOp, Op: T): UnaryOp {
  let { line, column, start, end, raw } = mapBase(context, node);

  if (node.second) {
    throw new Error(`unexpected '${node.operator}' operator with two operands: ${inspect(node)}`);
  }

  return new Op(
    line, column, start, end, raw,
    mapAny(context, node.first)
  );
}

function mapBinaryOrUnaryOp<B extends IBinaryOp, U extends IUnaryOp>(context: ParseContext, node: CoffeeOp, BinaryOp: B, UnaryOp: U): Op {
  if (node.second) {
    return mapBinaryOp(context, node, BinaryOp);
  } else {
    return mapUnaryOp(context, node, UnaryOp);
  }
}
