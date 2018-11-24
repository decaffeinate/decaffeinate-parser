import { parse } from '@babel/parser';
import { ExpressionStatement, RegExpLiteral } from '@babel/types';

/**
 * Parses JavaScript source representing a regular expression.
 */
export default function parseRegExp(string: string): { pattern: string, flags?: string } {
  let expressionStatement = parse(`(${string})`).program.body[0] as ExpressionStatement;
  let literal = expressionStatement.expression as RegExpLiteral;
  return literal;
}
