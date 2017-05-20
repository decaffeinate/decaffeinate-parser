import isPlusTokenBetweenRanges from './isPlusTokenBetweenRanges';
import ParseContext from './ParseContext';

export type Op = {
  type: string;
  left: {
    range: [number, number];
  };
  right: {
    range: [number, number];
  };
};

/**
 * Determine if the operator is a fake + operator for string interpolation.
 */
export default function isImplicitPlusOp(op: Op, context: ParseContext): boolean {
  if (op.type !== 'PlusOp') {
    return false;
  }

  return !isPlusTokenBetweenRanges(op.left.range, op.right.range, context);
}
