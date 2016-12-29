import { parse } from 'babylon';

/**
 * Parses JavaScript source representing a string.
 */
export default function parseString(string: string): string {
  return parse(`(${string})`).program.body[0].expression.value;
}
