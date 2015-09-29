import type from './type';

/**
 * @param {Object} node A CoffeeScript node.
 * @returns {boolean}
 */
export default function isChainedComparison(node) {
  if (type(node) === 'Op' && isComparisonOperator(node)) {
    return isComparisonOperator(node.first) || isComparisonOperator(node.second);
  } else {
    return false;
  }
}

/**
 * @param {Object} node A CoffeeScript node.
 * @returns {boolean}
 */
function isComparisonOperator(node) {
  switch (node.operator) {
    case '<':
    case '>':
    case '<=':
    case '>=':
      return true;

    default:
      return false;
  }
}
