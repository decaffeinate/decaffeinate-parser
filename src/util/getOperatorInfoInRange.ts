import SourceType from 'coffee-lex/dist/SourceType';
import { OperatorInfo } from '../nodes';
import ParseContext from './ParseContext';

/**
 * Gets information about an operator token found between start and end source
 * offsets, exclusive. When calling, make sure `start` is before the text of
 * the operator in the range, and `end` is after it.
 */
export default function getOperatorInfoInRange(
  context: ParseContext,
  start: number,
  end: number
): OperatorInfo {
  const startIndex = context.sourceTokens.indexOfTokenNearSourceIndex(start);
  const endIndex = context.sourceTokens.indexOfTokenNearSourceIndex(end);

  if (!startIndex || !endIndex) {
    throw new Error(
      `cannot find token indexes of range bounds: [${start}, ${end}]`
    );
  }

  const operatorIndex = context.sourceTokens.indexOfTokenMatchingPredicate(
    token =>
      token.type !== SourceType.LPAREN && token.type !== SourceType.RPAREN,
    startIndex.next(),
    endIndex
  );

  const operatorToken =
    operatorIndex && context.sourceTokens.tokenAtIndex(operatorIndex);

  if (!operatorToken) {
    throw new Error(`cannot find operator token in range: [${start}, ${end}]`);
  }

  return new OperatorInfo(
    context.source.slice(operatorToken.start, operatorToken.end),
    operatorToken
  );
}
