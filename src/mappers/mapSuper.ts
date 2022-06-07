import { SourceType } from 'coffee-lex';
import { Super as CoffeeSuper } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Node, Super } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import { reduceProperty } from './mapValue';

export default function mapSuper(
  context: ParseContext,
  node: CoffeeSuper
): Node {
  const location = getLocation(context, node);
  const { line, column, start } = location;

  const superTokenIndex =
    context.sourceTokens.indexOfTokenStartingAtSourceIndex(start);
  if (!superTokenIndex) {
    throw new Error('Expected token at the start of super node.');
  }
  const superToken = context.sourceTokens.tokenAtIndex(superTokenIndex);
  if (!superToken || superToken.type !== SourceType.SUPER) {
    throw new Error('Expected super token at the start of super node.');
  }
  const superNode = new Super(
    line,
    column,
    start,
    superToken.end,
    context.source.slice(superToken.start, superToken.end)
  );
  return reduceProperty(context, location, superNode, node.accessor);
}
