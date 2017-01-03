import { SourceType } from 'coffee-lex';
import { While as CoffeeWhile } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Loop, While } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapWhile(context: ParseContext, node: CoffeeWhile): While | Loop {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  let startTokenIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(start);
  let startToken = startTokenIndex && context.sourceTokens.tokenAtIndex(startTokenIndex);

  if (startToken && startToken.type === SourceType.LOOP) {
    return new Loop(
      line, column, start, end, raw, virtual,
      node.body ? mapAny(context, node.body) : null
    );
  }

  return new While(
    line, column, start, end, raw, virtual,
    mapAny(context, node.condition),
    node.guard ? mapAny(context, node.guard) : null,
    node.body ? mapAny(context, node.body) : null,
    node.condition.inverted === true
  );
}
