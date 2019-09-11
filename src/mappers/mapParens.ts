import {
  Block,
  Parens,
  StringWithInterpolations
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Node, SeqOp } from '../nodes';
import isCommentOnlyNode from '../util/isCommentOnlyNode';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapParens(
  context: ParseContext,
  node: Parens | StringWithInterpolations
): Node {
  if (!(node.body instanceof Block)) {
    return mapAny(context, node.body);
  }

  let { expressions } = node.body;
  expressions = expressions.filter(expr => !isCommentOnlyNode(expr));

  if (expressions.length === 1) {
    return mapAny(context, expressions[0]);
  }

  return expressions
    .map(expression => mapAny(context, expression))
    .reduceRight(
      (right, left) =>
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
