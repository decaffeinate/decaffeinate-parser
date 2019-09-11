import SourceType from 'coffee-lex/dist/SourceType';
import { In as CoffeeIn } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { InOp } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapIn(context: ParseContext, node: CoffeeIn): InOp {
  // We don't use the `negated` flag on `node` because it gets set to
  // `true` when a parent `If` is an `unless`.
  const { line, column, start, end, raw } = getLocation(context, node);
  const left = mapAny(context, node.object);
  const right = mapAny(context, node.array);
  let isNot = false;

  const lastTokenIndexOfLeft = context.sourceTokens.indexOfTokenEndingAtSourceIndex(
    left.end
  );
  const firstTokenIndexOfRight = context.sourceTokens.indexOfTokenStartingAtSourceIndex(
    right.start
  );
  const relationTokenIndex = context.sourceTokens.indexOfTokenMatchingPredicate(
    token => token.type === SourceType.RELATION,
    lastTokenIndexOfLeft,
    firstTokenIndexOfRight
  );

  if (relationTokenIndex) {
    const relationToken = context.sourceTokens.tokenAtIndex(relationTokenIndex);

    if (relationToken) {
      isNot =
        context.source.slice(relationToken.start, relationToken.end) !== 'in';

      return new InOp(line, column, start, end, raw, left, right, isNot);
    }
  }

  throw new Error(`unable to find RELATION token between operands`);
}
