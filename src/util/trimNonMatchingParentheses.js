import { LPAREN, RPAREN } from 'coffee-lex';
/**
 * @param {string} source
 * @param {{first_line: number, first_column: number, last_line: number, last_column: number}} loc
 * @param {function(number, number): number} mapper
 * @param {SourceTokenList} sourceTokens
 */
export default function trimNonMatchingParentheses(source, loc, mapper, sourceTokens) {
  let first = mapper(loc.first_line, loc.first_column);
  let last = mapper(loc.last_line, loc.last_column);

  // Ensure first & last are in bounds.

  if (first < 0) {
    first = 0;
    const firstLoc = mapper.invert(first);
    loc.first_line = firstLoc.line;
    loc.first_column = firstLoc.column;
  }

  if (last >= source.length) {
    last = source.length - 1;
    const lastLoc = mapper.invert(last);
    loc.last_line = lastLoc.line;
    loc.last_column = lastLoc.column;
  }

  let level = 0;
  let lastBalancedIndex = first;

  for (let index = first; index <= last; index++) {
    const sourceTokenIndex = sourceTokens.indexOfTokenStartingAtSourceIndex(index);
    if (sourceTokenIndex) {
      const sourceToken = sourceTokens.tokenAtIndex(sourceTokenIndex);
      if (sourceToken.type === LPAREN) {
        level++;
      } else if (sourceToken.type === RPAREN) {
        level--;
        if (level < 0) {
          break;
        }
      }
    }
    if (level === 0) {
      lastBalancedIndex = index;
    }
  }

  if (level !== 0 && lastBalancedIndex !== last) {
    last = lastBalancedIndex;
    const lastLoc = mapper.invert(last);
    loc.last_line = lastLoc.line;
    loc.last_column = lastLoc.column;
  }
}
