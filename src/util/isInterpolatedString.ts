import { Base, Op } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import isPlusTokenBetweenRanges from './isPlusTokenBetweenRanges';
import ParseContext from './ParseContext';

export default function isInterpolatedString(node: Op, ancestors: Array<Base>, context: ParseContext): boolean {
  let range = rangeOfInterpolatedStringForNode(node, context);

  if (!range) {
    return false;
  }

  let parentOp: Op | null = null;

  for (let i = ancestors.length - 1; i >= 0; i--) {
    let ancestor = ancestors[i];
    if (ancestor instanceof Op) {
      parentOp = ancestor;
      break;
    }
  }

  if (!parentOp) {
    // `node` is in an interpolated string but there is no containing
    // operator, so it must be a root.
    return true;
  }

  let parentRange = rangeOfInterpolatedStringForNode(parentOp, context);

  if (!parentRange) {
    // There's a containing operator, but there's no interpolated string.
    return true;
  }

  // There's a string interpolation containing the parent operator, but is it
  // the same one? If not, then this node is the root of an interpolated string.
  return parentRange[0] !== range[0] || parentRange[1] !== range[1];
}

function rangeOfInterpolatedStringForNode(node: Op, context: ParseContext) {
  if (node.operator !== '+' || !node.second) {
    return null;
  }

  let firstRange = context.getRange(node.first);
  let secondRange = context.getRange(node.second);

  if (!firstRange || !secondRange) {
    return null;
  }

  if (isPlusTokenBetweenRanges(firstRange, secondRange, context)) {
    return null;
  }

  let range = context.getRange(node);

  if (!range) {
    return null;
  }

  let tokens = context.sourceTokens;
  let startTokenIndex = tokens.indexOfTokenContainingSourceIndex(range[0]);

  if (!startTokenIndex) {
    throw new Error(
      `no token containing start of node at ${range[0]} found`
    );
  }

  return tokens.rangeOfInterpolatedStringTokensContainingTokenIndex(
    startTokenIndex
  );
}
