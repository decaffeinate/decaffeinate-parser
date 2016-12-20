import LinesAndColumns from 'lines-and-columns';

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
    this.linesAndColumns = new LinesAndColumns(source);
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
        this.linesAndColumns.indexForLocation({ line: locatable.first_line, column: locatable.first_column }),
        this.linesAndColumns.indexForLocation({ line: locatable.last_line, column: locatable.last_column })
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
