import {
  SSTRING_START,
  SSTRING_END,
  DSTRING_START,
  DSTRING_END,
  TSSTRING_START,
  TSSTRING_END,
  TDSTRING_START,
  TDSTRING_END
} from 'coffee-lex';

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
  return (startType === SSTRING_START && endType === SSTRING_END) ||
    (startType === DSTRING_START && endType === DSTRING_END) ||
    (startType === TSSTRING_START && endType === TSSTRING_END) ||
    (startType === TDSTRING_START && endType === TDSTRING_END);
}
