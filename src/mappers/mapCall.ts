import SourceType from 'coffee-lex/dist/SourceType';
import { Call, Splat } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import {
  BareSuperFunctionApplication, FunctionApplication, NewOp, Node, SoakedFunctionApplication,
  Super
} from '../nodes';
import isHeregexTemplateNode from '../util/isHeregexTemplateNode';
import locationsEqual from '../util/locationsEqual';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapCall(context: ParseContext, node: Call): Node {
  let { line, column, start, end, raw } = mapBase(context, node);

  if (node.do || isHeregexTemplateNode(node, context)) {
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
