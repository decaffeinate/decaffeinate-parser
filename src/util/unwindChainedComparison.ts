import { Base, Op } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';

export default function unwindChainedComparison(node: Op): Array<Base> {
  let operands: Array<Base> = [];

  for (let link: Base = node;;) {
    if (link instanceof Op) {
      let { first, second } = link;

      if (!second) {
        operands = [link, ...operands];
        break;
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
