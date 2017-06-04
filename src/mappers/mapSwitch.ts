import SourceToken from 'coffee-lex/dist/SourceToken';
import SourceType from 'coffee-lex/dist/SourceType';
import { Switch as CoffeeSwitch } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Switch, SwitchCase } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapSwitch(context: ParseContext, node: CoffeeSwitch): Switch {
  let { line, column, start, end, raw } = mapBase(context, node);

  let expression = node.subject ? mapAny(context, node.subject) : null;
  let cases = node.cases.map(([conditions, body]) => {
    if (!Array.isArray(conditions)) {
      conditions = [conditions];
    }
    let switchConditions = conditions.map(condition => mapAny(context, condition));
    let consequent = mapPossiblyEmptyBlock(context, body);
    let whenToken = getWhenTokenBeforeOffset(context, switchConditions[0].start, start);
    let locationForIndex = context.linesAndColumns.locationForIndex(whenToken.start);

    if (!locationForIndex) {
      throw new Error(`cannot map WHEN token start to line/column: ${whenToken.start}`);
    }

    let { line: caseLine, column: caseColumn } = locationForIndex;
    let { end } = mapBase(context, body);
    return new SwitchCase(
      caseLine + 1, caseColumn + 1, whenToken.start, end,
      context.source.slice(whenToken.start, end),
      switchConditions,
      consequent
    );
  });

  return new Switch(
    line, column, start, end, raw,
    expression,
    cases,
    mapPossiblyEmptyBlock(context, node.otherwise)
  );
}

function getWhenTokenBeforeOffset(context: ParseContext, offset: number, lowerBound: number): SourceToken {
  let offsetTokenIndex = context.sourceTokens.indexOfTokenNearSourceIndex(offset);
  let lowerBoundTokenIndex = context.sourceTokens.indexOfTokenNearSourceIndex(lowerBound);
  let whenTokenIndex = context.sourceTokens.lastIndexOfTokenMatchingPredicate(
    token => token.type === SourceType.WHEN,
    offsetTokenIndex,
    lowerBoundTokenIndex
  );

  if (whenTokenIndex) {
    let whenToken = context.sourceTokens.tokenAtIndex(whenTokenIndex);

    if (whenToken) {
      return whenToken;
    }
  }

  throw new Error(`unable to find WHEN token before ${offset} (lower bound: ${lowerBound})`);
}
