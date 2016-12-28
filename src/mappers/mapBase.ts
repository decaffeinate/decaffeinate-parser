import { SourceType } from 'coffee-lex';
import { Base } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { Node } from '../nodes';
import ParseContext from '../util/ParseContext';

export default function mapBase(context: ParseContext, node: Base): Node {
  let loc = node.locationData;
  let start = context.linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });
  let last = context.linesAndColumns.indexForLocation({ line: loc.last_line, column: loc.last_column });

  if (start === null || last === null) {
    throw new Error(`unable to determine range for location: ${inspect(loc)}}`);
  }

  let line = loc.first_line + 1;
  let column = loc.first_column + 1;
  let end = last + 1;

  // Shrink to be within the size of the source.
  if (start < 0) {
    start = 0;
  }
  if (end > context.source.length) {
    end = context.source.length;
  }

  // Shrink the end to the nearest semantic token.
  let lastTokenIndexOfNode = context.sourceTokens.lastIndexOfTokenMatchingPredicate(token => {
    return (
      token.end <= end &&
      token.type !== SourceType.NEWLINE &&
      token.type !== SourceType.COMMENT &&
      token.type !== SourceType.HERECOMMENT
    );
  }, context.sourceTokens.indexOfTokenNearSourceIndex(end));

  if (lastTokenIndexOfNode === null) {
    throw new Error(`unable to find last token for node: ${inspect(node)}`);
  }

  let lastTokenOfNode = context.sourceTokens.tokenAtIndex(lastTokenIndexOfNode);

  if (lastTokenOfNode === null) {
    throw new Error(`unable to find last token for node: ${inspect(node)}`);
  }

  end = lastTokenOfNode.end;
  let raw = context.source.slice(start, end);

  return new Node('Node', line, column, start, end, raw, false);
}
