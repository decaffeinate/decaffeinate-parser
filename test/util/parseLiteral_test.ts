import { deepEqual } from 'assert';

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
