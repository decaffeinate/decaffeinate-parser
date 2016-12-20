import { SourceType } from 'coffee-lex';
import { LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import ParseContext from './ParseContext';

export type DecaffeinateNode = {
  type: string;
  line: number;
  column: number;
  range: [number, number];
  raw: string;
  virtual?: boolean;
};

// tslint:disable-next-line:no-any
export default function makeNode(context: ParseContext, type: string, loc: LocationData, attrs: any = {}): DecaffeinateNode {
  // tslint:disable-next-line:no-any
  const result: any = { type };

  if (loc) {
    let start = context.linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });
    let last = context.linesAndColumns.indexForLocation({ line: loc.last_line, column: loc.last_column });

    if (start === null || last === null) {
      throw new Error(`unable to determine range for location: ${inspect(loc)}}`);
    }

    result.line = loc.first_line + 1;
    result.column = loc.first_column + 1;
    result.range = [start, last + 1];
  } else {
    result.virtual = true;
  }

  for (let key in attrs) {
    if (attrs.hasOwnProperty(key)) {
      let value = attrs[key];
      result[key] = value;
      if (value && result.range) {
        (Array.isArray(value) ? value : [value]).forEach(node => {
          if (node.range) {
            // Expand the range to contain all the children.
            if (result.range[0] > node.range[0]) {
              result.range[0] = node.range[0];
            }
            if (result.range[1] < node.range[1]) {
              result.range[1] = node.range[1];
            }
          }
        });
      }
    }
  }

  if (result.range) {
    // Shrink to be within the size of the source.
    if (result.range[0] < 0) {
      result.range[0] = 0;
    }
    if (result.range[1] > context.source.length) {
      result.range[1] = context.source.length;
    }

    // Shrink the end to the nearest semantic token.
    let lastTokenIndexOfNode = context.sourceTokens.lastIndexOfTokenMatchingPredicate(token => {
      return (
        token.end <= result.range[1] &&
        token.type !== SourceType.NEWLINE &&
        token.type !== SourceType.COMMENT &&
        token.type !== SourceType.HERECOMMENT
      );
    }, context.sourceTokens.indexOfTokenNearSourceIndex(result.range[1]));

    if (lastTokenIndexOfNode === null) {
      throw new Error(`unable to find last token for node: ${inspect(result)}`);
    }

    let lastTokenOfNode = context.sourceTokens.tokenAtIndex(lastTokenIndexOfNode);

    if (lastTokenOfNode === null) {
      throw new Error(`unable to find last token for node: ${inspect(result)}`);
    }

    result.range[1] = lastTokenOfNode.end;
    result.raw = context.source.slice(result.range[0], result.range[1]);
  }

  return result;
}
