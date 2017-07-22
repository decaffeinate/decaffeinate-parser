import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import { Base } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import ParseContext from './ParseContext';

export type NodeLocation = {
  line: number,
  column: number,
  start: number,
  end: number,
  raw: string,
};

export default function getLocation(context: ParseContext, node: Base): NodeLocation {
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

  let firstTokenOfNode = firstSemanticTokenAfter(context, start, node);
  let lastTokenOfNode = firstSemanticTokenBefore(context, end, node);

  start = firstTokenOfNode.start;
  end = lastTokenOfNode.end;
  let raw = context.source.slice(start, end);

  return {line, column, start, end, raw};
}

function firstSemanticTokenAfter(context: ParseContext, index: number, node: Base) {
  let tokenIndex = context.sourceTokens.indexOfTokenMatchingPredicate(token => {
    return (
      token.start >= index &&
      token.type !== SourceType.NEWLINE &&
      token.type !== SourceType.COMMENT
    );
  }, context.sourceTokens.indexOfTokenNearSourceIndex(index));
  return tokenFromIndex(context, tokenIndex, node);
}

function firstSemanticTokenBefore(context: ParseContext, index: number, node: Base) {
  let tokenIndex = context.sourceTokens.lastIndexOfTokenMatchingPredicate(token => {
    return (
      token.end <= index &&
      token.type !== SourceType.NEWLINE &&
      token.type !== SourceType.COMMENT
    );
  }, context.sourceTokens.indexOfTokenNearSourceIndex(index));
  return tokenFromIndex(context, tokenIndex, node);
}

function tokenFromIndex(context: ParseContext, tokenIndex: SourceTokenListIndex | null, node: Base) {
  if (tokenIndex === null) {
    throw new Error(`unable to find token index for node: ${inspect(node)}`);
  }
  let token = context.sourceTokens.tokenAtIndex(tokenIndex);
  if (token === null) {
    throw new Error(`unable to find token for node: ${inspect(node)}`);
  }
  return token;
}
