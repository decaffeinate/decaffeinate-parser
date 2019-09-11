import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import {
  Index,
  Slice
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { inspect } from 'util';
import ParseContext from './ParseContext';

export default function rangeOfBracketTokensForIndexNode(
  context: ParseContext,
  indexNode: Index | Slice
): [SourceTokenListIndex, SourceTokenListIndex] {
  const start = context.linesAndColumns.indexForLocation({
    line: indexNode.locationData.first_line,
    column: indexNode.locationData.first_column
  });

  if (start !== null) {
    const startTokenIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(
      start
    );

    if (startTokenIndex !== null) {
      const range = context.sourceTokens.rangeOfMatchingTokensContainingTokenIndex(
        SourceType.LBRACKET,
        SourceType.RBRACKET,
        startTokenIndex
      );

      if (range !== null) {
        return range;
      }
    }
  }

  throw new Error(
    `cannot find braces surrounding index at ` +
      `${indexNode.locationData.first_line + 1}:${
        indexNode.locationData.first_column
      }: ` +
      `${inspect(indexNode)}`
  );
}
