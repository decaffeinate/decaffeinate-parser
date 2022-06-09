import { SourceToken } from 'coffee-lex';
import { SourceType } from 'coffee-lex';
import { LocationData } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import {
  firstSemanticTokenAfter,
  firstSemanticTokenBefore,
} from './getLocation';
import locationDataFromSourceRange from './locationDataFromSourceRange';
import ParseContext from './ParseContext';
import sourceRangeFromLocationData, {
  SourceRange,
} from './sourceRangeFromLocationData';

export default function expandToIncludeParens(
  context: ParseContext,
  locationData: LocationData
): LocationData {
  let sourceRange = sourceRangeFromLocationData(context, locationData);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const tokens = getSurroundingParens(context, sourceRange);
    if (tokens === null) {
      break;
    }
    sourceRange = { start: tokens.openParen.start, end: tokens.closeParen.end };
  }
  return locationDataFromSourceRange(context, sourceRange);
}

type Tokens = { openParen: SourceToken; closeParen: SourceToken };

function getSurroundingParens(
  context: ParseContext,
  sourceRange: SourceRange
): Tokens | null {
  const tokenBefore = firstSemanticTokenBefore(context, sourceRange.start);
  const tokenAfter = firstSemanticTokenAfter(context, sourceRange.end);
  if (tokenBefore === null || tokenBefore.type !== SourceType.LPAREN) {
    return null;
  }
  if (tokenAfter === null || tokenAfter.type !== SourceType.RPAREN) {
    return null;
  }
  return { openParen: tokenBefore, closeParen: tokenAfter };
}
