import { parse } from 'babylon';

/**
 * Parses JavaScript source representing a regular expression.
 */
export default function parseRegExp(string: string): { pattern: string, flags: string } {
  return parse(`(${string})`).program.body[0].expression;
}
