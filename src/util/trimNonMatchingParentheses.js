import { CALL_START, CALL_END, LPAREN, RPAREN } from 'coffee-lex';

/**
 * @param {string} source
 * @param {{first_line: number, first_column: number, last_line: number, last_column: number}} loc
 * @param {ParseContext} context
 */
export default function trimNonMatchingParentheses(source, loc, context) {
  let mapper = context.lineMap;
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
  let lastTokenIndex = null;

  for (let index = first; index <= last; index++) {
    let currentTokenIndex = context.sourceTokens.indexOfTokenContainingSourceIndex(index);

    if (currentTokenIndex !== lastTokenIndex) {
      lastTokenIndex = currentTokenIndex;

      if (!currentTokenIndex) {
        continue;
      }

      let currentToken = context.sourceTokens.tokenAtIndex(currentTokenIndex);

      switch (currentToken.type) {
        case LPAREN:
        case CALL_START:
          level++;
          break;

        case RPAREN:
        case CALL_END:
          level--;
          break;
      }

      if (level < 0) {
        break;
      }
    }

    if (level === 0) {
      lastBalancedIndex = index;
    }
  }

  if (level !== 0 && lastBalancedIndex !== last) {
    last = lastBalancedIndex;
    let lastLoc = mapper.invert(last);
    loc.last_line = lastLoc.line;
    loc.last_column = lastLoc.column;
  }
}
