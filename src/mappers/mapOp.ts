import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import {Literal, Op as CoffeeOp, Value} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { inspect } from 'util';
import {
  Await,
  BinaryOp,
  BitAndOp,
  BitNotOp,
  BitOrOp,
  BitXorOp,
  ChainedComparisonOp,
  DeleteOp,
  DivideOp,
  ExistsOp,
  ExpOp,
  EQOp,
  FloorDivideOp,
  GTEOp,
  GTOp,
  InstanceofOp,
  LeftShiftOp,
  LogicalAndOp,
  LogicalNotOp,
  LogicalOrOp,
  LTEOp,
  LTOp,
  ModuloOp,
  MultiplyOp,
  NewOp,
  Node,
  NEQOp,
  OfOp,
  Op,
  OperatorInfo,
  PlusOp,
  PostDecrementOp,
  PostIncrementOp,
  PreDecrementOp,
  PreIncrementOp,
  RemOp,
  SignedRightShiftOp,
  SubtractOp,
  TypeofOp,
  UnaryNegateOp,
  UnaryOp,
  UnaryPlusOp,
  UnsignedRightShiftOp,
  Yield,
  YieldFrom,
} from '../nodes';
import getLocation from '../util/getLocation';
import getOperatorInfoInRange from '../util/getOperatorInfoInRange';
import isChainedComparison from '../util/isChainedComparison';
import isImplicitPlusOp from '../util/isImplicitPlusOp';
import makeString from '../util/makeString';
import ParseContext from '../util/ParseContext';
import UnsupportedNodeError from '../util/UnsupportedNodeError';
import unwindChainedComparison from '../util/unwindChainedComparison';
import mapAny from './mapAny';

export default function mapOp(context: ParseContext, node: CoffeeOp): Node {
  if (isChainedComparison(node)) {
    return mapChainedComparisonOp(context, node);
  } else {
    return mapOpWithoutChainedComparison(context, node);
  }
}

function mapChainedComparisonOp(context: ParseContext, node: CoffeeOp): ChainedComparisonOp {
  let { line, column, start, end, raw } = getLocation(context, node);
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

    case '!==':
      return mapBinaryOp(context, node, NEQOp);

    case '!':
      return mapUnaryOp(context, node, LogicalNotOp);

    case '+':
      return mapPlusOp(context, node);

    case '-':
      return mapBinaryOrUnaryOp(context, node, SubtractOp, UnaryNegateOp);

    case '&&':
      return mapBinaryOp(context, node, LogicalAndOp);

    case '||':
      return mapBinaryOp(context, node, LogicalOrOp);

    case '*':
      return mapBinaryOp(context, node, MultiplyOp);

    case '/':
      return mapBinaryOp(context, node, DivideOp);

    case '//':
      return mapBinaryOp(context, node, FloorDivideOp);

    case '?':
      return mapBinaryOp(context, node, ExistsOp);

    case '<':
      return mapBinaryOp(context, node, LTOp);

    case '<=':
      return mapBinaryOp(context, node, LTEOp);

    case '>':
      return mapBinaryOp(context, node, GTOp);

    case '>=':
      return mapBinaryOp(context, node, GTEOp);

    case '++':
      return mapUnaryOp(context, node, node.flip ? PostIncrementOp : PreIncrementOp);

    case '--':
      return mapUnaryOp(context, node, node.flip ? PostDecrementOp : PreDecrementOp);

    case 'typeof':
      return mapUnaryOp(context, node, TypeofOp);

    case 'instanceof':
      return mapNegateableBinaryOp(context, node, InstanceofOp);

    case 'delete':
      return mapUnaryOp(context, node, DeleteOp);

    case 'in':
      return mapNegateableBinaryOp(context, node, OfOp);

    case 'new':
      return mapNewOp(context, node);

    case '**':
      return mapBinaryOp(context, node, ExpOp);

    case '%':
      return mapBinaryOp(context, node, RemOp);

    case '%%':
      return mapBinaryOp(context, node, ModuloOp);

    case '&':
      return mapBinaryOp(context, node, BitAndOp);

    case '|':
      return mapBinaryOp(context, node, BitOrOp);

    case '^':
      return mapBinaryOp(context, node, BitXorOp);

    case '<<':
      return mapBinaryOp(context, node, LeftShiftOp);

    case '>>':
      return mapBinaryOp(context, node, SignedRightShiftOp);

    case '>>>':
      return mapBinaryOp(context, node, UnsignedRightShiftOp);

    case '~':
      return mapUnaryOp(context, node, BitNotOp);

    case 'yield':
      return mapYieldOp(context, node);

    case 'yield*':
      return mapUnaryOp(context, node, YieldFrom);

    case 'await':
      return mapUnaryOp(context, node, Await);
  }

  throw new UnsupportedNodeError(node);
}

function mapPlusOp(context: ParseContext, node: CoffeeOp): Node {
  if (node.second) {
    if (isImplicitPlusOp(node, context)) {
      return makeString(context, node);
    } else {
      return mapBinaryOp(context, node, PlusOp);
    }
  }
  return mapUnaryOp(context, node, UnaryPlusOp);
}

function mapNewOp(context: ParseContext, node: CoffeeOp): NewOp {
  if (node.second) {
    throw new Error(`unexpected 'new' operator with multiple operands: ${inspect(node)}`);
  }

  let { line, column, start, end, raw } = getLocation(context, node);

  return new NewOp(
    line, column, start, end, raw,
    mapAny(context, node.first),
    []
  );
}

function mapYieldOp(context: ParseContext, node: CoffeeOp): Yield {
  let { line, column, start, end, raw } = getLocation(context, node);
  if (isBareYield(node)) {
    return new Yield(line, column, start, end, raw, null);
  } else {
    return new Yield(line, column, start, end, raw, mapAny(context, node.first));
  }
}

function isBareYield(node: CoffeeOp): boolean {
  return node.first instanceof Value &&
    node.first.base instanceof Literal &&
    node.first.base.value === '';
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
  let { line, column, start, end, raw } = getLocation(context, node);

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
  let { line, column, start, end, raw } = getLocation(context, node);

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

interface INegateableBinaryOp {
  new(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
    isNot: boolean,
  ): BinaryOp;
}

/**
 * This class exists only to serve as a temporary binary operator, do not use.
 */
class TemporaryBinaryOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('TEMPORARY', line, column, start, end, raw, left, right);
  }
}

function tokenStartsWith(prefix: string, context: ParseContext, token: SourceToken): boolean {
  return context.source.slice(token.start, token.start + prefix.length) === prefix;
}

function mapNegateableBinaryOp<T extends INegateableBinaryOp>(context: ParseContext, node: CoffeeOp, Op: T): BinaryOp {
  let { line, column, start, end, raw, left, right } = mapBinaryOp(context, node, TemporaryBinaryOp);

  let lastTokenIndexOfLeft = context.sourceTokens.indexOfTokenEndingAtSourceIndex(left.end);
  let firstTokenIndexOfRight = context.sourceTokens.indexOfTokenStartingAtSourceIndex(right.start);
  let isNot = false;

  if (lastTokenIndexOfLeft) {
    for (let i = lastTokenIndexOfLeft.next(); i && i !== firstTokenIndexOfRight; i = i.next()) {
      let token = context.sourceTokens.tokenAtIndex(i);
      if (token && (token.type === SourceType.OPERATOR || token.type === SourceType.RELATION)) {
        isNot = tokenStartsWith('not', context, token) || tokenStartsWith('!', context, token);
        break;
      }
    }
  }

  return new Op(
    line, column, start, end, raw,
    left, right, isNot
  );
}
