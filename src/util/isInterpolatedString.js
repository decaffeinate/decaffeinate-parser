import nodeSource from './nodeSource';
import type from './type';

/**
 * @param {Object} node
 * @param {ParseContext} context
 */
export default function isInterpolatedString(node, context) {
  const [ firstToken ] = context.tokensForNode(node);

  if (firstToken) {
    const [ type ] = firstToken;
    if (type === 'STRING_START') {
      return true;
    }
  }

  return false;
}
