import { OPERATOR } from 'coffee-lex';

/**
 * Given the ranges of two operands, determine from the token list whether there
 * is a real '+' operator between them. A plus operation without an actual '+'
 * operator is an implicit string interpolation operation.
 */
export default function isPlusTokenBetweenRanges(leftRange, rightRange, context) {
  let tokens = context.sourceTokens;
  let leftEnd = tokens.indexOfTokenContainingSourceIndex(leftRange[1] - 1);
  let rightStart = tokens.indexOfTokenContainingSourceIndex(rightRange[0]);
  // Normal '+' operators should find tokens here, so if we don't, this must be
  // an implicit '+' operator.
  if (!leftEnd || !rightStart) {
    return false;
  }
  let tokensBetweenOperands = tokens.slice(leftEnd.next(), rightStart);
  // If we find an actual operator, this must have been a real '+'. Otherwise,
  // this must be an implicit '+'.
  let foundPlusToken = false;
  tokensBetweenOperands.forEach(({ type, start, end }) => {
    if (type === OPERATOR && context.source.slice(start, end) === '+') {
      foundPlusToken = true;
    }
  });
  return foundPlusToken;
}
