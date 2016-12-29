import SourceTokenList from 'coffee-lex/dist/SourceTokenList';
import { Base, Block, LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import LinesAndColumns from 'lines-and-columns';
import { DecaffeinateNode } from './makeNode';

class ParseError extends Error {
  syntaxError: SyntaxError;

  constructor(syntaxError: SyntaxError) {
    super(syntaxError.message);
    this.syntaxError = syntaxError;
  }
}

export default class ParseContext {
  source: string;
  linesAndColumns: LinesAndColumns;
  ast: Block;
  sourceTokens: SourceTokenList;

  constructor(source: string, sourceTokens: SourceTokenList, ast: Block) {
    this.source = source;
    this.linesAndColumns = new LinesAndColumns(source);
    this.ast = ast;
    this.sourceTokens = sourceTokens;
  }

  getRange(locatable: DecaffeinateNode | Base | LocationData): [number, number] | null {
    if ('range' in locatable) {
      return (locatable as DecaffeinateNode).range;
    } else if (locatable instanceof Base) {
      return this.getRange(locatable.locationData);
    } else {
      let locationData = locatable as LocationData;
      let start = this.linesAndColumns.indexForLocation({ line: locationData.first_line, column: locationData.first_column });
      let end = this.linesAndColumns.indexForLocation({ line: locationData.last_line, column: locationData.last_column });

      if (start === null || end === null) {
        return null;
      }

      return [start, end];
    }
  }

  static fromSource(source: string, sourceLex: (source: string) => SourceTokenList, parse: (source: string) => Block) {
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
