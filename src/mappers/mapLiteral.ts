import SourceType from 'coffee-lex/dist/SourceType';
import { Literal } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { Break, Continue, Float, Identifier, Int, JavaScript, Node, Regex, RegexFlags, This } from '../nodes';
import isStringAtPosition from '../util/isStringAtPosition';
import makeHeregex from '../util/makeHeregex';
import makeString from '../util/makeString';
import ParseContext from '../util/ParseContext';
import parseNumber from '../util/parseNumber';
import parseRegExp from '../util/parseRegExp';
import mapBase from './mapBase';

const HEREGEX_PATTERN = /^\/\/\/((?:.|\s)*)\/\/\/([gimy]*)$/;

export default function mapLiteral(context: ParseContext, node: Literal): Node {
  let { line, column, start, end, raw } = mapBase(context, node);

  if (node.value === 'this') {
    return new This(line, column, start, end, raw);
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
    // Sometimes the CoffeeScript AST contains a string object instead of a
    // string primitive. Convert to string primitive if necessary.
    let value = node.value.valueOf();
    return new Identifier(line, column, start, end, raw, value);
  }

  if (startToken.type === SourceType.JS) {
    return new JavaScript(line, column, start, end, raw, node.value);
  }

  if (startToken.type === SourceType.NUMBER) {
    if (raw.includes('.')) {
      return new Float(line, column, start, end, raw, parseNumber(node.value));
    } else {
      return new Int(line, column, start, end, raw, parseNumber(node.value));
    }
  }

  if (startToken.type === SourceType.REGEXP) {
    let regExp = parseRegExp(node.value);
    return new Regex(
      line, column, start, end, raw,
      regExp.pattern, RegexFlags.parse(regExp.flags)
    );
  }

  if (isStringAtPosition(start, end, context)) {
    return makeString(context, node);
  }

  if (startToken.type === SourceType.HEREGEXP_START && lastToken.type === SourceType.HEREGEXP_END) {
    let match = raw.match(HEREGEX_PATTERN);

    if (!match) {
      throw new Error(`unable to parse flags of heregex: ${inspect(node)}`);
    }

    let flags = match[2];
    return makeHeregex(context, node, flags);
  }

  if (
    startToken.type === SourceType.SSTRING_START ||
    startToken.type === SourceType.DSTRING_START ||
    startToken.type === SourceType.TSSTRING_START ||
    startToken.type === SourceType.TDSTRING_START ||
    startToken.type === SourceType.STRING_CONTENT ||
    startToken.type === SourceType.STRING_PADDING ||
    startToken.type === SourceType.STRING_LINE_SEPARATOR
  ) {
    // In rare cases (a string with only an empty interpolation), a quasi can
    // live by itself in the CoffeeScript AST. In that case, turn it into a
    // string by analyzing the tokens.
    return makeString(context, node);
  }

  if (startToken.type === SourceType.BREAK) {
    return new Break(line, column, start, end, raw);
  }

  if (startToken.type === SourceType.CONTINUE) {
    return new Continue(line, column, start, end, raw);
  }

  // Fall back to identifiers.
  return new Identifier(line, column, start, end, raw, node.value);
}
