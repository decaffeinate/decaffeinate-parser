import { SourceType } from 'coffee-lex';
import ParseContext from './ParseContext';

/**
 * Determine if the given code position contains a real string. If not, then it
 * is an interpolated string quasi.
 */
export default function isStringAtPosition(start: number, end: number, context: ParseContext): boolean {
  let tokens = context.sourceTokens;
  let startTokenIndex = tokens.indexOfTokenContainingSourceIndex(start);
  let endTokenIndex = tokens.indexOfTokenContainingSourceIndex(end - 1);

  if (startTokenIndex === null || endTokenIndex === null) {
    return false;
  }

  let startToken = tokens.tokenAtIndex(startTokenIndex);
  let endToken = tokens.tokenAtIndex(endTokenIndex);

  if (startToken === null || endToken === null) {
    return false;
  }

  let startType = startToken.type;
  let endType = endToken.type;

  return (
    (startType === SourceType.SSTRING_START && endType === SourceType.SSTRING_END) ||
    (startType === SourceType.DSTRING_START && endType === SourceType.DSTRING_END) ||
    (startType === SourceType.TSSTRING_START && endType === SourceType.TSSTRING_END) ||
    (startType === SourceType.TDSTRING_START && endType === SourceType.TDSTRING_END)
  );
}
