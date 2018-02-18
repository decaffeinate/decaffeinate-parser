import { Op } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import isPlusTokenBetweenRanges from './isPlusTokenBetweenRanges';
import ParseContext from './ParseContext';

/**
 * Determine if the operator is a fake + operator for string interpolation.
 */
export default function isImplicitPlusOp(op: Op, context: ParseContext): boolean {
  if (op.operator !== '+' || !op.second) {
    return false;
  }
  let firstRange = context.getRange(op.first);
  let secondRange = context.getRange(op.second);
  if (!firstRange || !secondRange) {
    throw new Error('Expected valid location data on plus operation.');
  }
  return !isPlusTokenBetweenRanges(firstRange, secondRange, context);
}
