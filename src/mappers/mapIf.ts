import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import { If } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Conditional } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';
import mapBlock from './mapBlock';

export default function mapIf(context: ParseContext, node: If): Conditional {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  let condition = mapAny(context, node.condition);
  let consequent = mapBlock(context, node.body);
  let alternate = node.elseBody ? mapBlock(context, node.elseBody) : null;
  let isUnless = false;

  let left: SourceTokenListIndex | null = null;
  let right: SourceTokenListIndex | null = null;

  if (consequent.start < condition.start) {
    // POST-if, so look for tokens between the consequent and the condition
    left = context.sourceTokens.indexOfTokenEndingAtSourceIndex(consequent.end);
    right = context.sourceTokens.indexOfTokenStartingAtSourceIndex(condition.start);
  } else {
    // regular `if`, so look from the start of the node until the condition
    left = context.sourceTokens.indexOfTokenStartingAtSourceIndex(start);
    right = context.sourceTokens.indexOfTokenStartingAtSourceIndex(condition.start);
  }

  if (left && right) {
    isUnless = context.sourceTokens.indexOfTokenMatchingPredicate(
      token => (
        token.type === SourceType.IF &&
        context.source.slice(token.start, token.end) === 'unless'
      ),
      left,
      right
    ) !== null;
  }

  return new Conditional(
    line, column, start, end, raw, virtual,
    condition,
    consequent,
    alternate,
    isUnless
  );
}
