import { parse } from '@codemod/parser';
import { ExpressionStatement, StringLiteral } from '@babel/types';

/**
 * Parses JavaScript source representing a string.
 */
export default function parseString(string: string): string {
  const expressionStatement = parse(`(${string})`).program
    .body[0] as ExpressionStatement;
  const literal = expressionStatement.expression as StringLiteral;
  return literal.value;
}
