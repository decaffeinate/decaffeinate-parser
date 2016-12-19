import { SourceType } from 'coffee-lex';

/**
 * Determine if the given code position contains a real string. If not, then it
 * is an interpolated string quasi.
 */
export default function isStringAtPosition(start, end, context) {
  let tokens = context.sourceTokens;
  let startTokenIndex = tokens.indexOfTokenContainingSourceIndex(start);
  let endTokenIndex = tokens.indexOfTokenContainingSourceIndex(end - 1);
  if (startTokenIndex === null || endTokenIndex === null) {
    return false;
  }
  let startType = tokens.tokenAtIndex(startTokenIndex).type;
  let endType = tokens.tokenAtIndex(endTokenIndex).type;
  return (startType === SourceType.SSTRING_START && endType === SourceType.SSTRING_END) ||
    (startType === SourceType.DSTRING_START && endType === SourceType.DSTRING_END) ||
    (startType === SourceType.TSSTRING_START && endType === SourceType.TSSTRING_END) ||
    (startType === SourceType.TDSTRING_START && endType === SourceType.TDSTRING_END);
}
