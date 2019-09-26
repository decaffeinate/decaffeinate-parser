import { parse } from '@codemod/parser';
import { ExpressionStatement, NumericLiteral } from '@babel/types';

/**
 * Parses JavaScript source representing a number.
 */
export default function parseNumber(string: string): number {
  const expressionStatement = parse(`(${string})`).program
    .body[0] as ExpressionStatement;
  const literal = expressionStatement.expression as NumericLiteral;
  return literal.value;
}
