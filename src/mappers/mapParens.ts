import { Block, Parens } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Node, SeqOp } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapParens(context: ParseContext, node: Parens): Node {
  if (!(node.body instanceof Block)) {
    return mapAny(context, node.body);
  }

  let { expressions } = node.body;

  if (expressions.length === 1) {
    return mapAny(context, expressions[0]);
  }

  return expressions
    .map(expression => mapAny(context, expression))
    .reduceRight((right, left) =>
      new SeqOp(
        left.line,
        left.column,
        left.start,
        right.end,
        context.source.slice(left.start, right.end),
        left,
        right
      )
    );
}
