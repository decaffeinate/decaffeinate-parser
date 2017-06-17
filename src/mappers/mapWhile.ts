import { SourceType } from 'coffee-lex';
import { While as CoffeeWhile } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Block, Loop, While } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapWhile(context: ParseContext, node: CoffeeWhile): While | Loop {
  let { line, column, start, end, raw } = mapBase(context, node);
  let startTokenIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(start);
  let startToken = startTokenIndex && context.sourceTokens.tokenAtIndex(startTokenIndex);

  if (startToken && startToken.type === SourceType.LOOP) {
    return new Loop(
      line, column, start, end, raw,
      mapPossiblyEmptyBlock(context, node.body)
    );
  }

  let condition = mapAny(context, node.condition);
  let guard = node.guard ? mapAny(context, node.guard) : null;
  let body = mapPossiblyEmptyBlock(context, node.body);

  if (body instanceof Block && body.start < condition.start) {
    body = body.withInline(true);
  }

  return new While(
    line, column, start, end, raw,
    condition, guard, body,
    node.condition.inverted === true
  );
}
