import { Base, Op } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';

export default function unwindChainedComparison(node: Op): Array<Base> {
  let operands: Array<Base> = [];

  for (let link: Base = node;;) {
    if (link instanceof Op) {
      let { first, second } = link;

      if (!second) {
        throw new Error(`unexpected unary operator inside chained comparison: ${inspect(node)}`);
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
