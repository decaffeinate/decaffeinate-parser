import parseLiteral from '../../src/util/parseLiteral';
import { strictEqual } from 'assert';

describe('parseLiteral', () => {
  it('parses single-quoted strings', () => {
    strictEqual(parseLiteral('\'foo\''), 'foo');
  });

  it('parses single-quoted strings with single-quotes escaped', () => {
    strictEqual(parseLiteral('\'Brian\\\'s code\''), 'Brian\'s code');
  });

  it('parses single-quoted strings with escaped newlines', () => {
    strictEqual(parseLiteral('\'1\\n2\''), '1\n2');
  });

  it('parses double-quoted strings', () => {
    strictEqual(parseLiteral('"foo"'), 'foo');
  });

  it('parses double-quoted strings with double-quotes escaped', () => {
    strictEqual(parseLiteral('"Hello \\"Brian\\""'), 'Hello "Brian"');
  });

  it('parses double-quoted strings with escaped newlines', () => {
    strictEqual(parseLiteral('"1\\n2"'), '1\n2');
  });

  it('parses triple-single-quoted strings', () => {
    strictEqual(parseLiteral('\'\'\'foo\'\'\''), 'foo');
  });

  it('parses triple-single-quoted strings with single-quotes escaped', () => {
    strictEqual(parseLiteral('\'\'\'Brian\'s code\'\'\''), 'Brian\'s code');
  });

  it('parses triple-single-quoted strings with escaped newlines', () => {
    strictEqual(parseLiteral('\'\'\'1\\n2\'\'\''), '1\n2');
  });

  it('parses triple-double-quoted strings', () => {
    strictEqual(parseLiteral('"""foo"""'), 'foo');
  });

  it('parses triple-double-quoted strings with double-quotes escaped', () => {
    strictEqual(parseLiteral('"""Hello "Brian\\""""'), 'Hello "Brian"');
  });

  it('parses triple-double-quoted strings with escaped newlines', () => {
    strictEqual(parseLiteral('"""1\\n2"""'), '1\n2');
  });

  it('parses triple-double-quoted strings with escaped carriage returns', () => {
    strictEqual(parseLiteral('"""1\\r2"""'), '1\r2');
  });

  it('parses triple-double-quoted strings with escaped tabs', () => {
    strictEqual(parseLiteral('"""1\\t2"""'), '1\t2');
  });

  it('parses triple-double-quoted strings with escaped bell characters', () => {
    strictEqual(parseLiteral('"""1\\b2"""'), '1\b2');
  });

  it('parses triple-double-quoted strings with escaped vertical tabs', () => {
    strictEqual(parseLiteral('"""1\\v2"""'), '1\v2');
  });

  it('parses triple-double-quoted strings with escaped form feeds', () => {
    strictEqual(parseLiteral('"""1\\f2"""'), '1\f2');
  });

  it('parses triple-double-quoted strings with escaped hex digits', () => {
    strictEqual(parseLiteral('"""1\\xae2"""'), '1\xae2');
  });

  it('parses triple-double-quoted strings with escaped unicode digits', () => {
    strictEqual(parseLiteral('"""1\\u12342"""'), '1\u12342');
  });

  it('parses quoted strings containing null characters', () => {
    strictEqual(parseLiteral('"\\0"'), '\0');
  });

  it('parses integers', () => {
    strictEqual(parseLiteral('123'), 123);
  });

  it('parses floats', () => {
    strictEqual(parseLiteral('0.1'), 0.1);
  });

  it('parses floats without a leading digit', () => {
    strictEqual(parseLiteral('.1'), 0.1);
  });
});
