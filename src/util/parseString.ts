import { parse } from '@babel/parser';
import { ExpressionStatement, StringLiteral } from '@babel/types';

/**
 * Parses JavaScript source representing a string.
 */
export default function parseString(string: string): string {
  let expressionStatement = parse(`(${string})`).program.body[0] as ExpressionStatement;
  let literal = expressionStatement.expression as StringLiteral;
  return literal.value;
}
