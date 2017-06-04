import { SourceType } from 'coffee-lex';
import { Block as CoffeeBlock, Comment } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Block } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapBlock(context: ParseContext, node: CoffeeBlock): Block {
  if (node.expressions.length === 0) {
    throw new UnsupportedNodeError(node, 'Unexpected mapBlock call with an empty block.');
  }

  let { line, column, start, end, raw } = mapBase(context, node);
  let previousTokenIndex = context.sourceTokens.indexOfTokenNearSourceIndex(start).previous();
  let previousToken = previousTokenIndex ? context.sourceTokens.tokenAtIndex(previousTokenIndex) : null;
  let inline = previousToken ? previousToken.type !== SourceType.NEWLINE : false;

  return new Block(
    line, column, start, end, raw,
    node.expressions
      .filter(expression => !(expression instanceof Comment))
      .map(expression => mapAny(context, expression)),
    inline
  );
}
