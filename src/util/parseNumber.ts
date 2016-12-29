import { parse } from 'babylon';

/**
 * Parses JavaScript source representing a number.
 */
export default function parseNumber(string: string): number {
  return parse(`(${string})`).program.body[0].expression.value;
}
