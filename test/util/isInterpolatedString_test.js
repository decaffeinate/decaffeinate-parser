import isInterpolatedString from '../../src/util/isInterpolatedString';
import ParseContext from '../../src/util/ParseContext';
import { nodes as parse, tokens as lex } from 'coffee-script';
import { ok } from 'assert';

describe('isInterpolatedString', () => {
  it('is false for non-interpolated strings', () => {
    const context = ParseContext.fromSource('"a"', lex, parse);
    ok(!isInterpolatedString(context.ast.expressions[0], context));
  });

  it('is true for strings that contain nothing but a single interpolation', () => {
    const context = ParseContext.fromSource('"#{a}"', lex, parse);
    ok(isInterpolatedString(context.ast.expressions[0], context));
  });

  it('is true for strings that start with an interpolation', () => {
    const context = ParseContext.fromSource('"#{a}b"', lex, parse);
    ok(isInterpolatedString(context.ast.expressions[0], context));
  });

  it('is true for strings that start with string value but contain an interpolation', () => {
    const context = ParseContext.fromSource('"a#{b}"', lex, parse);
    ok(isInterpolatedString(context.ast.expressions[0], context));
  });
});
