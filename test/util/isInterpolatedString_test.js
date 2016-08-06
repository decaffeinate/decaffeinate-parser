import isInterpolatedString from '../../src/util/isInterpolatedString';
import ParseContext from '../../src/util/ParseContext';
import coffeeLex from 'coffee-lex';
import { nodes as parse } from 'decaffeinate-coffeescript';
import { ok } from 'assert';

describe('isInterpolatedString', () => {
  it('is false for non-interpolated strings', () => {
    let { node, ancestors, context } = getStringInfo('"a"', false);
    ok(!isInterpolatedString(node, ancestors, context));
  });

  it('is true for strings that contain nothing but a single interpolation', () => {
    let { node, ancestors, context } = getStringInfo('"#{a}"', true);
    ok(isInterpolatedString(node, ancestors, context));
  });

  it('is true for strings that start with an interpolation', () => {
    let { node, ancestors, context } = getStringInfo('"#{a}b"', true);
    ok(isInterpolatedString(node, ancestors, context));
  });

  it('is true for strings that start with string value but contain an interpolation', () => {
    let { node, ancestors, context } = getStringInfo('"a#{b}"', true);
    ok(isInterpolatedString(node, ancestors, context));
  });

  function getStringInfo(source, interpolated) {
    let context = ParseContext.fromSource(source, coffeeLex, parse);

    if (interpolated) {
      return {
        node: context.ast.expressions[0].base.body.expressions[0],
        ancestors: [
          context.ast.expressions[0].base.body,
          context.ast.expressions[0].base,
          context.ast.expressions[0],
          context.ast
        ],
        context
      };
    } else {
      return {
        node: context.ast.expressions[0],
        ancestors: [
          context.ast
        ],
        context
      };
    }
  }
});
