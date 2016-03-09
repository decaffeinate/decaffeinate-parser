import binarySearch from 'binary-search';
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
    this.lineMap = lineColumnMapper(source);
    this.ast = ast;
    this.tokens = this.transformTokens(tokens);
  }

  /**
   * @param {Object} locatable
   * @returns {number[]}
   */
  getRange(locatable) {
    if ('range' in locatable) {
      return locatable.range;
    } else if ('locationData' in locatable) {
      return this.getRange(locatable.locationData);
    } else {
      return [
        this.lineMap(locatable.first_line, locatable.first_column),
        this.lineMap(locatable.last_line, locatable.last_column) + 1
      ];
    }
  }

  /**
   * @param {Object} node
   * @returns {string}
   */
  getNodeSource(node) {
    return this.source.slice(...this.getRange(node));
  }

  /**
   * @param {Object} node
   * @returns {Array}
   */
  tokensForNode(node) {
    let [ start, end ] = this.getRange(node);
    let firstTokenIndex = this.indexOfTokenAtOffset(start);

    if (firstTokenIndex < 0) {
      return [];
    }

    const result = [];
    for (let i = firstTokenIndex; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.range[1] > end) {
        break;
      }
      result.push(token);
    }
    return result;
  }

  tokenAtIndex(index) {
    return this.tokens[index] || null;
  }

  indexOfTokenAtOffset(offset) {
    let tokens = this.tokens;
    let index = binarySearch(tokens, offset, (token, offset) => token.range[0] - offset);
    while (tokens[index - 1] && tokens[index - 1].range[0] === offset) {
      // There can be multiple tokens that start at the same offset, e.g.
      // STRING and STRING_START with string interpolation.
      index--;
    }
    return index;
  }

  indexOfTokenFromOffset(offset) {
    let index = this.indexOfTokenAtOffset(offset);

    if (index < 0) {
      for (let i = ~index; i < this.tokens.length; i++) {
        if (this.tokens[i].range[0] >= offset) {
          return i;
        }
      }
    }

    return index;
  }

  /**
   * @param {number} index
   * @returns {?number}
   */
  indexOfEndTokenForStartTokenAtIndex(index) {
    let startToken = this.tokenAtIndex(index);
    let expectedEndTokenType;
    switch (startToken.type) {
      case 'PARAM_START':
        expectedEndTokenType = 'PARAM_END';
        break;

      case 'STRING_START':
        expectedEndTokenType = 'STRING_END';
        break;

      default:
        throw new Error(`unexpected start token type: ${startToken.type}`);
    }
    let tokens = this.tokens;
    for (let i = index; i < tokens.length; i++) {
      if (tokens[i].type === expectedEndTokenType) {
        return i;
      }
    }
    return null;
  }

  /**
   * @param {Object} left
   * @param {Object} right
   * @returns {Array}
   */
  tokensBetweenNodes(left, right) {
    let leftIndex = this.indexOfTokenFromOffset(this.getRange(left)[1]);
    let rightIndex = this.indexOfTokenAtOffset(this.getRange(right)[0]);
    if (leftIndex < 0 || rightIndex < 0) {
      return [];
    }
    return this.tokens.slice(leftIndex, rightIndex);
  }

  transformTokens(tokens) {
    return tokens.map(token => this.transformToken(token));
  }

  /**
   * @param token
   * @returns {{type: string, data: string, range: number[], original: *}}
   */
  transformToken(token) {
    return {
      type: token[0],
      data: token[1],
      range: this.getRange(token[2]),
      original: token
    };
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