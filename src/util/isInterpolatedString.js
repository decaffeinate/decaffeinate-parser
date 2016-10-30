import type from './type.js';
import isPlusTokenBetweenRanges from './isPlusTokenBetweenRanges';

/**
 * @param {Object} node
 * @param {Array<Object>} ancestors
 * @param {ParseContext} context
 * @returns boolean
 */
export default function isInterpolatedString(node, ancestors, context) {
  let range = rangeOfInterpolatedStringForNode(node, context);

  if (!range) {
    return false;
  }

  let parentOp;
  for (let i = ancestors.length - 1; i >= 0; i--) {
    if (type(ancestors[i]) === 'Op') {
      parentOp = ancestors[i];
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

function rangeOfInterpolatedStringForNode(node, context) {
  if (node.operator !== '+' || !node.second) {
    return null;
  }
  if (isPlusTokenBetweenRanges(
      context.getRange(node.first), context.getRange(node.second), context)) {
    return null;
  }

  let range = context.getRange(node);
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
