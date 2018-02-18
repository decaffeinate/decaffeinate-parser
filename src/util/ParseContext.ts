import SourceTokenList from 'coffee-lex/dist/SourceTokenList';
import { Base, Block, LocationData } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import LinesAndColumns from 'lines-and-columns';
import { ClassProtoAssignOp, Constructor } from '../nodes';

class ParseError extends Error {
  syntaxError: SyntaxError;

  constructor(syntaxError: SyntaxError) {
    super(syntaxError.message);
    this.syntaxError = syntaxError;
  }
}

/**
 * Any information we need to know about the current state of parsing. While the
 * hope is that this is mostly immutable, with replace operations as we walk the
 * AST, it is partially mutable to collect bound method names in a class.
 */
export class ParseState {
  currentClassCtor: Constructor | null;
  constructor(readonly currentClassBoundMethods: Array<ClassProtoAssignOp> | null) {
    this.currentClassCtor = null;
  }

  isInClassBody(): boolean {
    return this.currentClassBoundMethods !== null;
  }

  recordBoundMethod(method: ClassProtoAssignOp): void {
    if (!this.currentClassBoundMethods) {
      throw new Error('Cannot assign a bound method name when there is no current class.');
    }
    this.currentClassBoundMethods.push(method);
  }

  recordConstructor(ctor: Constructor): void {
    this.currentClassCtor = ctor;
  }

  pushCurrentClass(): ParseState {
    return new ParseState([]);
  }

  dropCurrentClass(): ParseState {
    return new ParseState(null);
  }

  static initialState(): ParseState {
    return new ParseState(null);
  }
}

export default class ParseContext {
  constructor(
    readonly source: string,
    readonly linesAndColumns: LinesAndColumns,
    readonly sourceTokens: SourceTokenList,
    readonly ast: Block,
    readonly parseState: ParseState) {
  }

  getRange(locatable: Base | LocationData): [number, number] | null {
    if (locatable instanceof Base) {
      return this.getRange(locatable.locationData);
    } else {
      let locationData = locatable as LocationData;
      let start = this.linesAndColumns.indexForLocation({ line: locationData.first_line, column: locationData.first_column });
      let end = this.linesAndColumns.indexForLocation({ line: locationData.last_line, column: locationData.last_column });

      if (start === null || end === null) {
        return null;
      }

      return [start, end + 1];
    }
  }

  static fromSource(source: string, sourceLex: (source: string) => SourceTokenList, parse: (source: string) => Block): ParseContext {
    try {
      const sourceTokens = sourceLex(source);
      return new ParseContext(
        source,
        new LinesAndColumns(source),
        sourceTokens,
        parse(source),
        ParseState.initialState()
      );
    } catch (ex) {
      if (ex instanceof SyntaxError) {
        throw new ParseError(ex);
      } else {
        throw ex;
      }
    }
  }

  updateState(updater: (oldState: ParseState) => ParseState): ParseContext {
    return new ParseContext(
      this.source, this.linesAndColumns, this.sourceTokens, this.ast,
      updater(this.parseState)
    );
  }
}
