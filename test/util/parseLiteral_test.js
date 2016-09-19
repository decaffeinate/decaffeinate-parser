import { deepEqual } from 'assert';
import * as CoffeeScript from 'decaffeinate-coffeescript';

import parseLiteral from '../../src/util/parseLiteral';

describe('parseLiteral', () => {
  it('parses single-quoted strings', () => {
    deepEqual(parseLiteral('\'foo\''), { type: 'string', data: 'foo' });
  });

  it('parses single-quoted strings with single-quotes escaped', () => {
    deepEqual(parseLiteral('\'Brian\\\'s code\''), { type: 'string', data: 'Brian\'s code' });
  });

  it('parses single-quoted strings with escaped newlines', () => {
    deepEqual(parseLiteral('\'1\\n2\''), { type: 'string', data: '1\n2' });
  });

  it('parses double-quoted strings', () => {
    deepEqual(parseLiteral('"foo"'), { type: 'string', data: 'foo' });
  });

  it('parses double-quoted strings with double-quotes escaped', () => {
    deepEqual(parseLiteral('"Hello \\"Brian\\""'), { type: 'string', data: 'Hello "Brian"' });
  });

  it('parses double-quoted strings with escaped newlines', () => {
    deepEqual(parseLiteral('"1\\n2"'), { type: 'string', data: '1\n2' });
  });

  it('parses triple-single-quoted strings', () => {
    deepEqual(parseLiteral('\'\'\'foo\'\'\''), { type: 'Herestring', data: 'foo', padding: [] });
  });

  it('parses triple-single-quoted strings with single-quotes escaped', () => {
    deepEqual(parseLiteral('\'\'\'Brian\'s code\'\'\''), { type: 'Herestring', data: 'Brian\'s code', padding: [] });
  });

  it('parses triple-single-quoted strings with escaped newlines', () => {
    deepEqual(parseLiteral('\'\'\'1\\n2\'\'\''), { type: 'Herestring', data: '1\n2', padding: [] });
  });

  it('parses triple-double-quoted strings', () => {
    deepEqual(parseLiteral('"""foo"""'), { type: 'Herestring', data: 'foo', padding: [] });
  });

  it('parses triple-double-quoted strings with double-quotes escaped', () => {
    deepEqual(parseLiteral('"""Hello "Brian\\""""'), { type: 'Herestring', data: 'Hello "Brian"', padding: [] });
  });

  it('parses triple-double-quoted strings with escaped newlines', () => {
    deepEqual(parseLiteral('"""1\\n2"""'), { type: 'Herestring', data: '1\n2', padding: [] });
  });

  it('parses triple-double-quoted strings with escaped carriage returns', () => {
    deepEqual(parseLiteral('"""1\\r2"""'), { type: 'Herestring', data: '1\r2', padding: [] });
  });

  it('parses triple-double-quoted strings with escaped tabs', () => {
    deepEqual(parseLiteral('"""1\\t2"""'), { type: 'Herestring', data: '1\t2', padding: [] });
  });

  it('parses triple-double-quoted strings with escaped bell characters', () => {
    deepEqual(parseLiteral('"""1\\b2"""'), { type: 'Herestring', data: '1\b2', padding: [] });
  });

  it('parses triple-double-quoted strings with escaped vertical tabs', () => {
    deepEqual(parseLiteral('"""1\\v2"""'), { type: 'Herestring', data: '1\v2', padding: [] });
  });

  it('parses triple-double-quoted strings with escaped form feeds', () => {
    deepEqual(parseLiteral('"""1\\f2"""'), { type: 'Herestring', data: '1\f2', padding: [] });
  });

  it('parses triple-double-quoted strings with escaped hex digits', () => {
    deepEqual(parseLiteral('"""1\\xae2"""'), { type: 'Herestring', data: '1\xae2', padding: [] });
  });

  it('parses triple-double-quoted strings with escaped unicode digits', () => {
    deepEqual(parseLiteral('"""1\\u12342"""'), { type: 'Herestring', data: '1\u12342', padding: [] });
  });

  it('parses quoted strings containing null characters', () => {
    deepEqual(parseLiteral('"\\0"'), { type: 'string', data: '\0' });
  });

  it('parses integers', () => {
    deepEqual(parseLiteral('123'), { type: 'int', data: 123 });
  });

  it('parses floats', () => {
    deepEqual(parseLiteral('0.1'), { type: 'float', data: 0.1 });
  });

  it('parses floats without a leading digit', () => {
    deepEqual(parseLiteral('.1'), { type: 'float', data: 0.1 });
  });

  it('inserts proper padding with when parsing multi-line herestrings', () => {
    deepEqual(parseLiteral("'''a\n b'''"), { type: 'Herestring', data: 'a\nb', padding: [[5, 6]] });
  });

  it('ignores the indentation level of the first line in herestrings', () => {
    verifyHerestringMatchesCoffeeScript(`a
      b`, 'a\nb');
  });

  it('removes leading nonempty indentation in herestrings', () => {
    verifyHerestringMatchesCoffeeScript(`
 a
  b
c
d`,
      'a\n b\nc\nd');
  });

  it('preserves leading indentation on the first line in herestrings if necessary', () => {
    verifyHerestringMatchesCoffeeScript(` a
          b
            c
          d`, ' a\nb\n  c\nd');
  });

  it('removes indentation normally if the first full line is empty', () => {
    verifyHerestringMatchesCoffeeScript(`

  a
  b
  c`, '\na\nb\nc');
  });

  it('uses indentation 0 for herestrings if the first full line is nonempty and has indentation 0', () => {
    verifyHerestringMatchesCoffeeScript(`
a
  b
 c
d`,
      'a\n  b\n c\nd');
  });

  it('removes indentation from the first line if possible', () => {
    verifyHerestringMatchesCoffeeScript(`     a
      b
    c
      d`,
      ' a\n  b\nc\n  d');
  });

  it('keeps spacing in the second line if there are two lines and both are only whitespace', () => {
    verifyHerestringMatchesCoffeeScript(`    
   `,
      '   ');
  });

  it('removes leading whitespace from herestrings with tabs', () => {
    verifyHerestringMatchesCoffeeScript(`
\t\t\t\ta
\t\tb`,
      '\t\ta\nb');
  });

  it('handles a string with a leading and trailing blank line', () => {
    verifyHerestringMatchesCoffeeScript(`
a
`,
      'a');
  });

  it('handles a string with a blank line with spaces in it', () => {
    verifyHerestringMatchesCoffeeScript(`
  a
 
  b`,
      'a\n \nb');
  });

  it('handles a string where the last line is a blank line with spaces', () => {
    verifyHerestringMatchesCoffeeScript(`
  a
  b
 `,
      'a\nb');
  });

  function verifyHerestringMatchesCoffeeScript(stringContents, expectedResultString) {
    let code = `"""${stringContents}"""`;
    let decaffeinateParserResult = parseLiteral(code).data;
    let coffeeScriptResult = JSON.parse(
      CoffeeScript.tokens(code)[0][1].replace(/\t/g, '\\t')
    );
    deepEqual(decaffeinateParserResult, coffeeScriptResult);
    deepEqual(decaffeinateParserResult, expectedResultString);
  }
});
