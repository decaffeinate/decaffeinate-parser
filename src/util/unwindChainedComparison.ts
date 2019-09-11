import { Base, Op } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { inspect } from 'util';

import isComparisonOperator from './isComparisonOperator';

export default function unwindChainedComparison(node: Op): Array<Base> {
  let operands: Array<Base> = [];

  for (let link: Base = node; ; ) {
    if (link instanceof Op && isComparisonOperator(link)) {
      const { first, second } = link;

      if (!second) {
        throw new Error(
          `unexpected unary operator inside chained comparison: ${inspect(
            node
          )}`
        );
      }

      operands = [second, ...operands];

      link = first;
    } else {
      operands = [link, ...operands];
      break;
    }
  }

  return operands;
}
