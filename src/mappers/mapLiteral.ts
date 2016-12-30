import SourceType from 'coffee-lex/dist/SourceType';
import { Literal } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { Float, Heregex, Identifier, Int, JavaScript, Node, Quasi, RegexFlags, String, This } from '../nodes';
import isStringAtPosition from '../util/isStringAtPosition';
import ParseContext from '../util/ParseContext';
import parseNumber from '../util/parseNumber';
import parseString from '../util/parseString';
import mapBase from './mapBase';

const HEREGEX_PATTERN = /^\/\/\/((?:.|\n)*)\/\/\/([gimy]*)$/;

export default function mapLiteral(context: ParseContext, node: Literal): Node {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  if (node.value === 'this') {
    return new This(line, column, start, end, raw, virtual);
  }

  let startTokenIndex = context.sourceTokens.indexOfTokenContainingSourceIndex(start);
  let lastTokenIndex = context.sourceTokens.indexOfTokenContainingSourceIndex(end - 1);

  if (!startTokenIndex || !lastTokenIndex) {
    throw new Error(`cannot find start/end tokens for literal: ${inspect(node)}`);
  }

  let startToken = context.sourceTokens.tokenAtIndex(startTokenIndex);
  let lastToken = context.sourceTokens.tokenAtIndex(lastTokenIndex);

  if (!startToken || !lastToken) {
    throw new Error(`cannot find start/end tokens for literal: ${inspect(node)}`);
  }

  if (startToken.type === SourceType.IDENTIFIER) {
    return new Identifier(line, column, start, end, raw, virtual, node.value);
  }

  if (startToken.type === SourceType.JS) {
    return new JavaScript(line, column, start, end, raw, virtual, node.value);
  }

  if (startToken.type === SourceType.NUMBER) {
    if (raw.includes('.')) {
      return new Float(line, column, start, end, raw, virtual, parseNumber(node.value));
    } else {
      return new Int(line, column, start, end, raw, virtual, parseNumber(node.value));
    }
  }

  if (isStringAtPosition(start, end, context)) {
    return new String(
      line, column, start, end, raw, virtual,
      [new Quasi(line, column, start, end, raw, virtual, parseString(node.value))],
      []
    );
  }

  if (startToken.type === SourceType.HEREGEXP_START && lastToken.type === SourceType.HEREGEXP_END) {
    let match = raw.match(HEREGEX_PATTERN);

    if (!match) {
      throw new Error(`unable to parse flags of heregex: ${inspect(node)}`);
    }

    let flags = match[2];

    return new Heregex(
      line, column, start, end, raw, virtual,
      [new Quasi(line, column, start, end, raw, virtual, node.value)],
      [],
      RegexFlags.parse(flags)
    );
  }

  if (
    startToken.type === SourceType.SSTRING_START ||
    startToken.type === SourceType.DSTRING_START ||
    startToken.type === SourceType.TSSTRING_START ||
    startToken.type === SourceType.TDSTRING_START ||
    startToken.type === SourceType.HEREGEXP_START ||
    startToken.type === SourceType.STRING_CONTENT ||
    startToken.type === SourceType.STRING_PADDING ||
    startToken.type === SourceType.STRING_LINE_SEPARATOR
  ) {
    // Top-level strings should all be in the same format: an array of
    // quasis and expressions. For a normal string literal, this is the
    // simple case of one quasi and no expressions. But if this string
    // is actually a quasi that CoffeeScript is calling a string, then
    // just return a Quasi node, and higher-up code should insert it
    // into a string interpolation.
    return new Quasi(line, column, start, end, raw, virtual, parseString(node.value));
  }

  // Fall back to identifiers.
  return new Identifier(line, column, start, end, raw, virtual, node.value);
}
