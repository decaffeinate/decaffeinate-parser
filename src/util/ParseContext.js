import lineColumnMapper from './lineColumnMapper';
import locationsEqual from './locationsEqual';

class ParseError extends Error {
  constructor(syntaxError) {
    super(syntaxError.message);
    this.syntaxError = syntaxError;
  }
}

export default class ParseContext {
  /**
   * @param {string} source
   * @param {Array} tokens
   * @param {Object} ast
   */
  constructor(source, tokens, ast) {
    this.source = source;
    this.tokens = tokens;
    this.ast = ast;
    this.lineMap = lineColumnMapper(source);
  }

  /**
   * @param {Object} node
   * @returns {number[]}
   */
  getNodeRange(node) {
    return [
      this.lineMap(node.first_line, node.first_column),
      this.lineMap(node.last_line, node.last_column) + 1
    ];
  }

  /**
   * @param {Object} node
   * @returns {string}
   */
  getNodeSource(node) {
    return this.source.slice(...this.getNodeRange(node));
  }

  /**
   * @param {Object} node
   * @yield {Array}
   */
  *tokensForNode(node) {
    const nodeLoc = node.locationData;
    let firstTokenIndex = null;

    for (let i = 0; i < this.tokens.length; i++) {
      const loc = this.tokens[i][2];
      if (nodeLoc.first_line === loc.first_line && nodeLoc.first_column === loc.first_column) {
        firstTokenIndex = i;
        break;
      }
    }

    if (firstTokenIndex === null) {
      return;
    }

    for (let i = firstTokenIndex; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      const loc = token[2];
      if (loc.last_line > nodeLoc.last_line) {
        break;
      }
      if (loc.last_line === nodeLoc.last_line && loc.last_column > nodeLoc.last_column) {
        break;
      }
      yield token;
    }
  }

  /**
   * @param {string} source
   * @param {function(string, Object=): Array} lex
   * @param {function(string|Array): Object} parse
   * @returns {ParseContext}
   */
  static fromSource(source, lex, parse) {
    try {
      const tokens = lex(source, { rewrite: false });
      return new ParseContext(source, tokens, parse(source));
    } catch (ex) {
      if (ex instanceof SyntaxError) {
        throw new ParseError(ex);
      } else {
        throw ex;
      }
    }
  }
}