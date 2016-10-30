import isPlusTokenBetweenRanges from './isPlusTokenBetweenRanges';

/**
 * Determine if the operator is a fake + operator for string interpolation.
 */
export default function isImplicitPlusOp(op, context) {
  if (op.type !== 'PlusOp') {
    return false;
  }
  return !isPlusTokenBetweenRanges(op.left.range, op.right.range, context);
}
