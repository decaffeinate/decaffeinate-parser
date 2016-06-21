import lineColumnMapper from './lineColumnMapper';

class ParseError extends Error {
  constructor(syntaxError) {
    super(syntaxError.message);
    this.syntaxError = syntaxError;
  }
}

export default class ParseContext {
  /**
   * @param {string} source
   * @param {SourceTokenList} sourceTokens
   * @param {Object} ast
   */
  constructor(source, sourceTokens, ast) {
    this.source = source;
    this.lineMap = lineColumnMapper(source);
    this.ast = ast;
    this.sourceTokens = sourceTokens;
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
   * @param {string} source
   * @param {function(string): SourceTokenList} sourceLex
   * @param {function(string|Array): Object} parse
   * @returns {ParseContext}
   */
  static fromSource(source, sourceLex, parse) {
    try {
      const sourceTokens = sourceLex(source);
      return new ParseContext(source, sourceTokens, parse(source));
    } catch (ex) {
      if (ex instanceof SyntaxError) {
        throw new ParseError(ex);
      } else {
        throw ex;
      }
    }
  }
}
