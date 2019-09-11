import { SourceType } from 'coffee-lex';
import ParseContext from './ParseContext';

/**
 * Given the ranges of two operands, determine from the token list whether there
 * is a real '+' operator between them. A plus operation without an actual '+'
 * operator is an implicit string interpolation operation.
 */
export default function isPlusTokenBetweenRanges(leftRange: [number, number], rightRange: [number, number], context: ParseContext): boolean {
  const tokens = context.sourceTokens;
  const leftEnd = tokens.indexOfTokenContainingSourceIndex(leftRange[1] - 1);
  const rightStart = tokens.indexOfTokenContainingSourceIndex(rightRange[0]);
  // Normal '+' operators should find tokens here, so if we don't, this must be
  // an implicit '+' operator.
  if (!leftEnd || !rightStart) {
    return false;
  }
  const afterLeftEnd = leftEnd.next();
  if (!afterLeftEnd) {
    return false;
  }
  const tokensBetweenOperands = tokens.slice(afterLeftEnd, rightStart);
  // If we find an actual operator, this must have been a real '+'. Otherwise,
  // this must be an implicit '+'.
  let foundPlusToken = false;
  tokensBetweenOperands.forEach(({ type, start, end }) => {
    if (type === SourceType.OPERATOR && context.source.slice(start, end) === '+') {
      foundPlusToken = true;
    }
  });
  return foundPlusToken;
}
