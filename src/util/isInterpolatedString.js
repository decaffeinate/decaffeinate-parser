import nodeSource from './nodeSource';
import type from './type';

/**
 * @param {Object} node
 * @param {ParseContext} context
 */
export default function isInterpolatedString(node, context) {
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
  ) !== null;
}
