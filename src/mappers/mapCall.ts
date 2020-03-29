import SourceType from 'coffee-lex/dist/SourceType';
import {
  Call,
  Literal,
  Splat,
  StringWithInterpolations,
  SuperCall,
  Value,
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { inspect } from 'util';
import {
  AssignOp,
  BareSuperFunctionApplication,
  BaseFunction,
  DefaultParam,
  DoOp,
  FunctionApplication,
  Identifier,
  NewOp,
  Node,
  SoakedFunctionApplication,
  SoakedNewOp,
  Super,
} from '../nodes';
import getLocation from '../util/getLocation';
import isHeregexTemplateNode from '../util/isHeregexTemplateNode';
import locationsEqual from '../util/locationsEqual';
import makeHeregex from '../util/makeHeregex';
import ParseContext from '../util/ParseContext';
import parseString from '../util/parseString';
import UnsupportedNodeError from '../util/UnsupportedNodeError';
import mapAny from './mapAny';
import mapCSX from './mapCSX';

export default function mapCall(context: ParseContext, node: Call): Node {
  const { line, column, start, end, raw } = getLocation(context, node);

  if (node.csx) {
    return mapCSX(context, node);
  }

  if (isHeregexTemplateNode(node, context)) {
    const firstArg = node.args[0];
    if (
      !(firstArg instanceof Value) ||
      !(firstArg.base instanceof StringWithInterpolations)
    ) {
      throw new Error('Expected a valid first heregex arg in the AST.');
    }
    const strNode = firstArg.base.body.expressions[0];
    let flags;
    if (node.args.length > 1) {
      const secondArg = node.args[1];
      if (
        !(secondArg instanceof Value) ||
        !(secondArg.base instanceof Literal)
      ) {
        throw new Error('Expected a string flags value in the heregex AST.');
      }
      flags = parseString(secondArg.base.value);
    } else {
      flags = '';
    }
    return makeHeregex(context, strNode, flags);
  }

  const args = node.args.map((arg) => mapAny(context, arg));

  if (node instanceof SuperCall) {
    if (
      node.args.length === 1 &&
      node.args[0] instanceof Splat &&
      locationsEqual(node.args[0].locationData, node.locationData)
    ) {
      return new BareSuperFunctionApplication(line, column, start, end, raw);
    }

    const superIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(
      start
    );
    const superToken =
      superIndex && context.sourceTokens.tokenAtIndex(superIndex);

    if (!superToken || superToken.type !== SourceType.SUPER) {
      throw new Error(
        `unable to find SUPER token in 'super' function call: ${inspect(node)}`
      );
    }

    const superLocation = context.linesAndColumns.locationForIndex(
      superToken.start
    );

    if (!superLocation) {
      throw new Error(
        `unable to locate SUPER token for 'super' function call: ${inspect(
          node
        )}`
      );
    }

    return new FunctionApplication(
      line,
      column,
      start,
      end,
      raw,
      new Super(
        superLocation.line + 1,
        superLocation.column + 1,
        superToken.start,
        superToken.end,
        context.source.slice(superToken.start, superToken.end)
      ),
      args
    );
  }

  if (!node.variable) {
    throw new Error('Expected non-super call to have a variable defined.');
  }
  const callee = mapAny(context, node.variable);

  if (node.isNew) {
    return mapNewOp(context, node);
  }

  if (node.soak) {
    return new SoakedFunctionApplication(
      line,
      column,
      start,
      end,
      raw,
      callee,
      args
    );
  }

  if (node.do) {
    return mapDoOp(context, node);
  }

  return new FunctionApplication(line, column, start, end, raw, callee, args);
}

function mapNewOp(context: ParseContext, node: Call): NewOp {
  if (!node.variable) {
    // This should only happen when `isSuper` is true.
    throw new UnsupportedNodeError(node);
  }

  const { line, column, start, end, raw } = getLocation(context, node);
  const callee = mapAny(context, node.variable);
  const args = node.args.map((arg) => mapAny(context, arg));

  if (node.soak) {
    return new SoakedNewOp(line, column, start, end, raw, callee, args);
  } else {
    return new NewOp(line, column, start, end, raw, callee, args);
  }
}

function mapDoOp(context: ParseContext, node: Call): DoOp {
  if (!node.variable) {
    // This should only happen when `isSuper` is true.
    throw new UnsupportedNodeError(node);
  }

  const { line, column, start, end, raw } = getLocation(context, node);

  let expression = mapAny(context, node.variable);

  const args = node.args.map((arg) => mapAny(context, arg));

  if (expression instanceof BaseFunction) {
    expression = augmentDoFunctionWithArgs(context, expression, args);
  } else if (
    expression instanceof AssignOp &&
    expression.expression instanceof BaseFunction
  ) {
    const newRhs = augmentDoFunctionWithArgs(
      context,
      expression.expression,
      args
    );
    expression = expression.withExpression(newRhs);
  }

  return new DoOp(line, column, start, end, raw, expression);
}

function augmentDoFunctionWithArgs(
  context: ParseContext,
  func: BaseFunction,
  args: Array<Node>
): BaseFunction {
  const newParameters = func.parameters.map((param, i) => {
    const arg = args[i];

    // If there's a parameter with no default, CoffeeScript will insert a fake
    // arg with the same value and location.
    if (
      arg instanceof Identifier &&
      param instanceof Identifier &&
      arg.data === param.data &&
      arg.start === param.start &&
      arg.end === param.end
    ) {
      return param;
    }

    return new DefaultParam(
      param.line,
      param.column,
      param.start,
      arg.end,
      context.source.slice(param.start, arg.end),
      param,
      arg
    );
  });

  return func.withParameters(newParameters);
}
