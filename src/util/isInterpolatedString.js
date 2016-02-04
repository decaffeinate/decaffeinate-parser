import nodeSource from './nodeSource';
import type from './type';

/**
 * @param {Object} node
 * @param {ParseContext} context
 */
export default function isInterpolatedString(node, context) {
  let tokens = context.tokensForNode(node);
  let firstToken = tokens[0];
  let lastToken = tokens[tokens.length - 1];

  if (firstToken && lastToken) {
    return firstToken.type === 'STRING_START' || lastToken.type === 'STRING_END';
  }

  return false;
}
