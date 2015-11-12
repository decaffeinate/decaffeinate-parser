import nodeSource from './nodeSource';
import type from './type';

/**
 * @param {Object} node
 * @param {ParseContext} context
 */
export default function isInterpolatedString(node, context) {
  const tokensForNode = context.tokensForNode(node);
  const firstTokenIteration = tokensForNode.next();

  if (!firstTokenIteration.done) {
    const [ type ] = firstTokenIteration.value;
    if (type === 'STRING_START') {
      return true;
    }
  }

  return false;
}
