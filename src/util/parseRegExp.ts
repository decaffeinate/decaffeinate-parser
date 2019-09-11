import { parse } from '@babel/parser';
import { ExpressionStatement, RegExpLiteral } from '@babel/types';

/**
 * Parses JavaScript source representing a regular expression.
 */
export default function parseRegExp(
  string: string
): { pattern: string; flags?: string } {
  const expressionStatement = parse(`(${string})`).program
    .body[0] as ExpressionStatement;
  const literal = expressionStatement.expression as RegExpLiteral;
  return literal;
}
