import ParseContext from '../../src/util/ParseContext';
import lex from 'coffee-lex';
import trimNonMatchingParentheses from '../../src/util/trimNonMatchingParentheses';
import { deepEqual } from 'assert';
import { nodes as parse } from 'coffee-script';

describe('trimNonMatchingParentheses', () => {
  it('does not change the location for a node without parentheses', () => {
    check(
      '0',
      { first_line: 0, first_column: 0, last_line: 0, last_column: 0 },
      { first_line: 0, first_column: 0, last_line: 0, last_column: 0 }
    );
  });

  it('does not change the location for a node ending with balanced parentheses', () => {
    check(
      'a()',
      { first_line: 0, first_column: 0, last_line: 0, last_column: 2 },
      { first_line: 0, first_column: 0, last_line: 0, last_column: 2 }
    );
  });

  it('does not change the location for a node starting with balanced parentheses', () => {
    check(
      '(a, b) =>',
      { first_line: 0, first_column: 0, last_line: 0, last_column: 8 },
      { first_line: 0, first_column: 0, last_line: 0, last_column: 8 }
    );
  });

  it('does change the location for a node with unbalanced trailing parentheses', () => {
    check(
      '(=> 0)()',
      { first_line: 0, first_column: 0, last_line: 0, last_column: 6 },
      { first_line: 0, first_column: 0, last_line: 0, last_column: 5 }
    );
  });

  it('strips off anything after an unbalanced opening parenthesis', () => {
    check(
      '((window))(=> 0)',
      { first_line: 0, first_column: 1, last_line: 0, last_column: 9 },
      { first_line: 0, first_column: 1, last_line: 0, last_column: 8 }
    );
  });

  it('strips off anything after an unbalanced closing parenthesis', () => {
    check(
      '((window))(=> 0)',
      { first_line: 0, first_column: 1, last_line: 0, last_column: 14 },
      { first_line: 0, first_column: 1, last_line: 0, last_column: 8 }
    );
  });

  it('fixes the location for a node with location ending past the source', () => {
    check(
      '(window)',
      { first_line: 0, first_column: 0, last_line: 0, last_column: 22 },
      { first_line: 0, first_column: 0, last_line: 0, last_column: 7 }
    );
  });

  it('fixes the location for a node with location starting before the source', () => {
    check(
      '(window)',
      { first_line: 0, first_column: -2, last_line: 0, last_column: 7 },
      { first_line: 0, first_column: 0, last_line: 0, last_column: 7 }
    );
  });

  it('fixes the location for a node with location starting before and ending after the source', () => {
    check(
      '(window)',
      { first_line: 0, first_column: -2, last_line: 0, last_column: 17 },
      { first_line: 0, first_column: 0, last_line: 0, last_column: 7 }
    );
  });

  it('strips off unmatched trailing closing parentheses', () => {
    check(
      '(window)',
      { first_line: 0, first_column: 1, last_line: 0, last_column: 7 },
      { first_line: 0, first_column: 1, last_line: 0, last_column: 6 }
    );
  });

  it('ignores parentheses in strings', () => {
    check(
      'a("foo" + ")")',
      { first_line: 0, first_column: 2, last_line: 0, last_column: 13 },
      { first_line: 0, first_column: 2, last_line: 0, last_column: 12 }
    );
  });

  function check(source, loc, expected) {
    const mapper = ParseContext.fromSource(source, lex, parse);
    trimNonMatchingParentheses(source, loc, mapper);
    deepEqual(loc, expected);
  }
});
