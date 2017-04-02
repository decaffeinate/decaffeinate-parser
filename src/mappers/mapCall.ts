import SourceType from 'coffee-lex/dist/SourceType';
import { Call, Splat } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import {
  AssignOp,
  BareSuperFunctionApplication, BaseFunction, DefaultParam, DoOp, FunctionApplication, Identifier, NewOp,
  Node, SoakedFunctionApplication, SoakedNewOp, Super
} from '../nodes';
import isHeregexTemplateNode from '../util/isHeregexTemplateNode';
import locationsEqual from '../util/locationsEqual';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapCall(context: ParseContext, node: Call): Node {
  let { line, column, start, end, raw } = mapBase(context, node);

  if (isHeregexTemplateNode(node, context)) {
    throw new UnsupportedNodeError(node);
  }

  let args = node.args.map(arg => mapAny(context, arg));

  if (!node.variable) {
    // This should only happen when `isSuper` is true.
    if (!node.isSuper) {
      throw new Error(`callee unexpectedly null in non-super call: ${inspect(node)}`);
    }

    if (
      node.args.length === 1 &&
      node.args[0] instanceof Splat &&
      locationsEqual(node.args[0].locationData, node.locationData)
    ) {
      return new BareSuperFunctionApplication(
        line,
        column,
        start,
        end,
        raw
      );
    }

    let superIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(start);
    let superToken = superIndex && context.sourceTokens.tokenAtIndex(superIndex);

    if (!superToken || superToken.type !== SourceType.SUPER) {
      throw new Error(`unable to find SUPER token in 'super' function call: ${inspect(node)}`);
    }

    let superLocation = context.linesAndColumns.locationForIndex(superToken.start);

    if (!superLocation) {
      throw new Error(`unable to locate SUPER token for 'super' function call: ${inspect(node)}`);
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

  let callee = mapAny(context, node.variable);

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

  return new FunctionApplication(
    line,
    column,
    start,
    end,
    raw,
    callee,
    args
  );
}

function mapNewOp(context: ParseContext, node: Call): NewOp {
  if (!node.variable) {
    // This should only happen when `isSuper` is true.
    throw new UnsupportedNodeError(node);
  }

  let { line, column, start, end, raw } = mapBase(context, node);
  let callee = mapAny(context, node.variable);
  let args = node.args.map(arg => mapAny(context, arg));

  if (node.soak) {
    return new SoakedNewOp(
      line,
      column,
      start,
      end,
      raw,
      callee,
      args
    );

  } else {
    return new NewOp(
      line,
      column,
      start,
      end,
      raw,
      callee,
      args
    );
  }
}

function mapDoOp(context: ParseContext, node: Call): DoOp {
  if (!node.variable) {
    // This should only happen when `isSuper` is true.
    throw new UnsupportedNodeError(node);
  }

  let { line, column, start, end, raw } = mapBase(context, node);

  let expression = mapAny(context, node.variable);


  let args = node.args.map((arg) => mapAny(context, arg));

  if (expression instanceof BaseFunction) {
    expression = augmentDoFunctionWithArgs(context, expression, args);
  } else if (expression instanceof AssignOp &&
      expression.expression instanceof BaseFunction) {
    let newRhs = augmentDoFunctionWithArgs(context, expression.expression, args);
    expression = expression.withExpression(newRhs);
  }

  return new DoOp(line, column, start, end, raw, expression);
}

function augmentDoFunctionWithArgs(
    context: ParseContext, func: BaseFunction, args: Array<Node>): BaseFunction {
  let newParameters = func.parameters.map((param, i) => {
    const arg = args[i];

    // If there's a parameter with no default, CoffeeScript will insert a fake
    // arg with the same value and location.
    if (arg instanceof Identifier && param instanceof Identifier &&
        arg.data === param.data &&
        arg.start === param.start && arg.end === param.end) {
      return param;
    }

    return new DefaultParam(
      param.line, param.column, param.start, arg.end,
      context.source.slice(param.start, arg.end),
      param, arg);
  });

  return func.withParameters(newParameters);
}
