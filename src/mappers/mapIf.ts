import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import { If } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Conditional } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapIf(context: ParseContext, node: If): Conditional {
  const { line, column, start, end, raw } = getLocation(context, node);

  const condition = mapAny(context, node.condition);
  let consequent = mapPossiblyEmptyBlock(context, node.body);
  const alternate = mapPossiblyEmptyBlock(context, node.elseBody);
  let isUnless = false;

  let left: SourceTokenListIndex | null = null;
  let right: SourceTokenListIndex | null = null;

  if (consequent && consequent.start < condition.start) {
    consequent = consequent.withInline(true);
    // POST-if, so look for tokens between the consequent and the condition
    left = context.sourceTokens.indexOfTokenEndingAtSourceIndex(consequent.end);
    right = context.sourceTokens.indexOfTokenStartingAtSourceIndex(
      condition.start
    );
  } else {
    // regular `if`, so look from the start of the node until the condition
    left = context.sourceTokens.indexOfTokenStartingAtSourceIndex(start);
    right = context.sourceTokens.indexOfTokenStartingAtSourceIndex(
      condition.start
    );
  }

  if (left && right) {
    isUnless =
      context.sourceTokens.indexOfTokenMatchingPredicate(
        (token) =>
          token.type === SourceType.IF &&
          context.source.slice(token.start, token.end) === 'unless',
        left,
        right
      ) !== null;
  }

  return new Conditional(
    line,
    column,
    start,
    end,
    raw,
    condition,
    consequent,
    alternate,
    isUnless
  );
}
