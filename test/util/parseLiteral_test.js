import parseLiteral from '../../src/util/parseLiteral';
import { deepEqual } from 'assert';

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
});
