import { Base, Op } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';

import isComparisonOperator from './isComparisonOperator';

export default function isChainedComparison(node: Base): boolean {
  if (node instanceof Op && isComparisonOperator(node)) {
    return isComparisonOperator(node.first) || (node.second ? isComparisonOperator(node.second) : false);
  } else {
    return false;
  }
}
