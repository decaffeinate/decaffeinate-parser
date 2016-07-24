import { OPERATOR } from 'coffee-lex';

/**
 * Determine if the operator is a fake + operator for string interpolation.
 */
export default function isImplicitPlusOp(op, context) {
  if (op.type !== 'PlusOp') {
    return false;
  }
  let tokens = context.sourceTokens;
  let leftEnd = tokens.indexOfTokenContainingSourceIndex(op.left.range[1] - 1);
  let rightStart = tokens.indexOfTokenContainingSourceIndex(op.right.range[0]);
  // Normal '+' operators should find tokens here, so if we don't, this must be
  // an implicit '+' operator.
  if (!leftEnd || !rightStart) {
    return true;
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
  return !foundPlusToken;
}
