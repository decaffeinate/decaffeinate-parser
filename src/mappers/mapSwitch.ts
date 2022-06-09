import { SourceToken } from 'coffee-lex';
import { SourceType } from 'coffee-lex';
import { Switch as CoffeeSwitch } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Switch, SwitchCase } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapSwitch(
  context: ParseContext,
  node: CoffeeSwitch
): Switch {
  const { line, column, start, end, raw } = getLocation(context, node);

  const expression = node.subject ? mapAny(context, node.subject) : null;
  const cases = node.cases.map(([conditions, body]) => {
    if (!Array.isArray(conditions)) {
      conditions = [conditions];
    }
    const switchConditions = conditions.map((condition) =>
      mapAny(context, condition)
    );
    const consequent = mapPossiblyEmptyBlock(context, body);
    const whenToken = getWhenTokenBeforeOffset(
      context,
      switchConditions[0].start,
      start
    );
    const locationForIndex = context.linesAndColumns.locationForIndex(
      whenToken.start
    );

    if (!locationForIndex) {
      throw new Error(
        `cannot map WHEN token start to line/column: ${whenToken.start}`
      );
    }

    const { line: caseLine, column: caseColumn } = locationForIndex;
    const { end } = getLocation(context, body);
    return new SwitchCase(
      caseLine + 1,
      caseColumn + 1,
      whenToken.start,
      end,
      context.source.slice(whenToken.start, end),
      switchConditions,
      consequent
    );
  });

  return new Switch(
    line,
    column,
    start,
    end,
    raw,
    expression,
    cases,
    mapPossiblyEmptyBlock(context, node.otherwise)
  );
}

function getWhenTokenBeforeOffset(
  context: ParseContext,
  offset: number,
  lowerBound: number
): SourceToken {
  const offsetTokenIndex =
    context.sourceTokens.indexOfTokenNearSourceIndex(offset);
  const lowerBoundTokenIndex =
    context.sourceTokens.indexOfTokenNearSourceIndex(lowerBound);
  const whenTokenIndex = context.sourceTokens.lastIndexOfTokenMatchingPredicate(
    (token) => token.type === SourceType.WHEN,
    offsetTokenIndex,
    lowerBoundTokenIndex
  );

  if (whenTokenIndex) {
    const whenToken = context.sourceTokens.tokenAtIndex(whenTokenIndex);

    if (whenToken) {
      return whenToken;
    }
  }

  throw new Error(
    `unable to find WHEN token before ${offset} (lower bound: ${lowerBound})`
  );
}
