import { Base, Op } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';

export default function isChainedComparison(node: Base): boolean {
  if (node instanceof Op && isComparisonOperator(node)) {
    return isComparisonOperator(node.first) || isComparisonOperator(node.second);
  } else {
    return false;
  }
}

function isComparisonOperator(node: Base): boolean {
  if (!(node instanceof Op)) {
    return false;
  }

  switch (node.operator) {
    case '<':
    case '>':
    case '<=':
    case '>=':
    case '===':
    case '!==':
      return true;

    default:
      return false;
  }
}
