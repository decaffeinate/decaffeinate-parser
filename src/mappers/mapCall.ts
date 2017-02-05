import SourceType from 'coffee-lex/dist/SourceType';
import { Call } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { FunctionApplication, NewOp, Node } from '../nodes';
import isHeregexTemplateNode from '../util/isHeregexTemplateNode';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapCall(context: ParseContext, node: Call): Node {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  if (node.isSuper || node.soak || node.do || isHeregexTemplateNode(node, context)) {
    throw new UnsupportedNodeError(node);
  }

  if (!node.variable) {
    // This should only happen when `isSuper` is true.
    throw new UnsupportedNodeError(node);
  }

  let callee = mapAny(context, node.variable);
  let args = node.args.map(arg => mapAny(context, arg));

  if (node.isNew) {
    return mapNewOp(context, node);
  }

  return new FunctionApplication(
    line,
    column,
    start,
    end,
    raw,
    virtual,
    callee,
    args
  );
}

function mapNewOp(context: ParseContext, node: Call): NewOp {
  if (!node.variable) {
    // This should only happen when `isSuper` is true.
    throw new UnsupportedNodeError(node);
  }

  let { end, virtual } = mapBase(context, node);
  let callee = mapAny(context, node.variable);
  let args = node.args.map(arg => mapAny(context, arg));

  let calleeStartTokenIndex = context.sourceTokens.indexOfTokenNearSourceIndex(callee.start);
  let newTokenIndex = context.sourceTokens.lastIndexOfTokenMatchingPredicate(
    token => {
      if (token.type === SourceType.NEW) {
        return true;
      }

      if (token.type !== SourceType.LPAREN) {
        throw new Error(`cannot find 'new' before callee: ${inspect(callee)}`);
      }

      return false;
    },
    calleeStartTokenIndex && calleeStartTokenIndex.previous()
  );

  let newToken = newTokenIndex && context.sourceTokens.tokenAtIndex(newTokenIndex);

  if (!newToken) {
    throw new Error(`cannot find 'new' before callee: ${inspect(callee)}`);
  }

  let newTokenLocation = context.linesAndColumns.locationForIndex(newToken.start);

  if (!newTokenLocation) {
    throw new Error(`cannot find 'new' before callee: ${inspect(callee)}`);
  }

  return new NewOp(
    newTokenLocation.line + 1,
    newTokenLocation.column + 1,
    newToken.start,
    end,
    context.source.slice(newToken.start, end),
    virtual,
    callee,
    args
  );
}
