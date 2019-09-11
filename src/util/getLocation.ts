import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { Base } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
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
  const loc = node.locationData;
  let start = context.linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });
  const last = context.linesAndColumns.indexForLocation({ line: loc.last_line, column: loc.last_column });

  if (start === null || last === null) {
    throw new Error(`unable to determine range for location: ${inspect(loc)}}`);
  }

  const line = loc.first_line + 1;
  const column = loc.first_column + 1;
  let end = last + 1;

  // Shrink to be within the size of the source.
  if (start < 0) {
    start = 0;
  }
  if (end > context.source.length) {
    end = context.source.length;
  }

  const firstTokenOfNode = requireToken(firstSemanticTokenAfter(context, start), node);
  const lastTokenOfNode = requireToken(firstSemanticTokenBefore(context, end), node);

  start = firstTokenOfNode.start;
  end = lastTokenOfNode.end;
  const raw = context.source.slice(start, end);

  return {line, column, start, end, raw};
}

export function firstSemanticTokenAfter(context: ParseContext, index: number): SourceToken | null {
  const tokenIndex = context.sourceTokens.indexOfTokenMatchingPredicate(token => {
    return (
      token.start >= index &&
      token.type !== SourceType.NEWLINE &&
      token.type !== SourceType.COMMENT
    );
  }, context.sourceTokens.indexOfTokenNearSourceIndex(index));
  return tokenIndex === null ? null : context.sourceTokens.tokenAtIndex(tokenIndex);
}

export function firstSemanticTokenBefore(context: ParseContext, index: number): SourceToken | null {
  const tokenIndex = context.sourceTokens.lastIndexOfTokenMatchingPredicate(token => {
    return (
      token.end <= index &&
      token.type !== SourceType.NEWLINE &&
      token.type !== SourceType.COMMENT
    );
  }, context.sourceTokens.indexOfTokenNearSourceIndex(index));
  return tokenIndex === null ? null : context.sourceTokens.tokenAtIndex(tokenIndex);
}

function requireToken(token: SourceToken | null, node: Base): SourceToken {
  if (token === null) {
    throw new Error(`unable to find token for node: ${inspect(node)}`);
  }
  return token;
}
