import { Op as CoffeeOp, Return as CoffeeReturn } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import {
  BinaryOp, ChainedComparisonOp, EQOp, MultiplyOp, Node, Op, OperatorInfo, SubtractOp, UnaryNegateOp, Yield, YieldFrom, YieldReturn
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
  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  let coffeeOperands = unwindChainedComparison(node);
  let operands = coffeeOperands.map(operand => mapAny(context, operand));
  let operators: Array<OperatorInfo> = [];

  for (let i = 0; i < operands.length - 1; i++) {
    let left = operands[i];
    let right = operands[i + 1];

    operators.push(getOperatorInfoInRange(context, left.end, right.start));
  }

  return new ChainedComparisonOp(
    line,
    column,
    start,
    end,
    raw,
    virtual,
    operands,
    operators
  );
}

function mapOpWithoutChainedComparison(context: ParseContext, node: CoffeeOp): Node {
  switch (node.operator) {
    case '===':
      return mapEqualityOp(context, node);

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

function mapEqualityOp(context: ParseContext, node: CoffeeOp) {
  return mapBinaryOp(context, node, EQOp);
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

interface IBinaryOp {
  new(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    left: Node,
    right: Node
  ): BinaryOp;
}

function mapBinaryOp<T extends IBinaryOp>(context: ParseContext, node: CoffeeOp, Op: T): BinaryOp {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  if (!node.second) {
    throw new Error(`unexpected '${node.operator}' operator with only one operand: ${inspect(node)}`);
  }

  return new Op(
    line, column, start, end, raw, virtual,
    mapAny(context, node.first),
    mapAny(context, node.second)
  );
}

function mapMultiplyOp(context: ParseContext, node: CoffeeOp): MultiplyOp {
  return mapBinaryOp(context, node, MultiplyOp);
}

function mapYieldOp(context: ParseContext, node: CoffeeOp): YieldReturn | Yield {
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

function mapYieldFromOp(context: ParseContext, node: CoffeeOp): YieldFrom {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  return new YieldFrom(
    line, column, start, end, raw, virtual,
    mapAny(context, node.first)
  );
}
