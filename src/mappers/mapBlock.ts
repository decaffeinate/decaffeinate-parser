import { SourceType } from 'coffee-lex';
import { Block as CoffeeBlock, Comment } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Block } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapBlock(context: ParseContext, node: CoffeeBlock): Block {
  if (node.expressions.length === 0) {
    throw new UnsupportedNodeError(node);
  }

  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  let previousTokenIndex = context.sourceTokens.indexOfTokenNearSourceIndex(start - 1);
  let previousToken = previousTokenIndex ? context.sourceTokens.tokenAtIndex(previousTokenIndex) : null;
  let inline = previousToken ? previousToken.type !== SourceType.NEWLINE : false;

  return new Block(
    line, column, start, end, raw, virtual,
    node.expressions
      .filter(expression => !(expression instanceof Comment))
      .map(expression => mapAny(context, expression)),
    inline
  );
}
