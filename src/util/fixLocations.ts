/* eslint-disable @typescript-eslint/camelcase */

import SourceType from 'coffee-lex/dist/SourceType';
import {
  Assign,
  Base,
  Block,
  Call,
  Class,
  Code,
  Extends,
  For,
  If,
  In,
  Index,
  Literal,
  Obj,
  Op,
  Param,
  Slice,
  Switch,
  Try,
  Value,
  While,
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import expandToIncludeParens from './expandToIncludeParens';
import fixInvalidLocationData from './fixInvalidLocationData';
import locationDataFromSourceRange from './locationDataFromSourceRange';
import locationWithLastPosition from './locationWithLastPosition';
import mergeLocations from './mergeLocations';
import ParseContext from './ParseContext';
import rangeOfBracketTokensForIndexNode from './rangeOfBracketTokensForIndexNode';
import sourceRangeFromLocationData from './sourceRangeFromLocationData';

export default function fixLocations(context: ParseContext, node: Base): void {
  const { linesAndColumns, source } = context;
  node.eachChild((child) => {
    if (child && child.locationData) {
      fixLocations(context, child);
    }
    return undefined;
  });

  node.locationData = fixInvalidLocationData(
    node.locationData,
    context.linesAndColumns
  );

  if (node instanceof Value) {
    const lastChild = node.properties[node.properties.length - 1] || node.base;
    if (lastChild) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Index || node instanceof Slice) {
    const rangeOfBrackets = rangeOfBracketTokensForIndexNode(context, node);
    const lbracket = context.sourceTokens.tokenAtIndex(rangeOfBrackets[0]);
    if (lbracket === null) {
      throw new Error('Expected to find left-bracket token.');
    }
    const lbracketLoc = linesAndColumns.locationForIndex(lbracket.start);
    if (lbracketLoc === null) {
      throw new Error(
        'Expected to find a location for the left-bracket token.'
      );
    }
    const rbracketIndex = rangeOfBrackets[1].previous();
    if (rbracketIndex === null) {
      throw new Error('Expected to find a non-null right-bracket token index.');
    }
    const rbracket = context.sourceTokens.tokenAtIndex(rbracketIndex);
    if (rbracket === null) {
      throw new Error('Expected to find right-bracket token.');
    }
    const rbracketLoc = linesAndColumns.locationForIndex(rbracket.start);
    if (rbracketLoc === null) {
      throw new Error(
        'Expected to find a location for the right-bracket token.'
      );
    }
    node.locationData = {
      first_line: lbracketLoc.line,
      first_column: lbracketLoc.column,
      last_line: rbracketLoc.line,
      last_column: rbracketLoc.column,
    };
  }

  if (node instanceof Obj) {
    const loc = node.locationData;
    const start = linesAndColumns.indexForLocation({
      line: loc.first_line,
      column: loc.first_column,
    });
    if (start === null) {
      throw new Error('Expected to find a start index for object.');
    }
    const end = linesAndColumns.indexForLocation({
      line: loc.last_line,
      column: loc.last_column,
    });
    if (end === null) {
      throw new Error('Expected to find an end index for object.');
    }
    const isImplicitObject = source[start] !== '{';
    if (isImplicitObject && source[end] !== ',') {
      const lastChild = node.properties[node.properties.length - 1];
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Op) {
    const lastChild = node.second;
    if (lastChild) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Assign) {
    const lastChild = node.value;
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof In) {
    const lastChild = node.array;
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof Call) {
    if (node.variable && !node.do && !node.csx) {
      // `super` won't have a callee (i.e. `node.variable`)
      const calleeLoc = node.variable.locationData;
      let calleeEnd = linesAndColumns.indexForLocation({
        line: calleeLoc.last_line,
        column: calleeLoc.last_column,
      });
      if (calleeEnd === null) {
        throw new Error('Expected to find index for callee end.');
      }
      calleeEnd++;
      // Account for soaked calls, e.g. `a?()`.
      if (source[calleeEnd] === '?') {
        calleeEnd += 1;
      }
      const isImplicitCall = source[calleeEnd] !== '(';
      if (isImplicitCall) {
        const lastChild = node.args[node.args.length - 1] || node.variable;
        if (lastChild) {
          node.locationData = locationWithLastPosition(
            node.locationData,
            lastChild.locationData
          );
        }
      }
    }
  }

  if (node instanceof Block) {
    const lastChild = node.expressions[node.expressions.length - 1];
    if (lastChild) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    } else {
      // Shorten range (usually length 1, the shortest range expressible by the CoffeeScript parser) to length 0.
      const sourceRange = sourceRangeFromLocationData(
        context,
        node.locationData
      );
      node.locationData = locationDataFromSourceRange(context, {
        start: sourceRange.end,
        end: sourceRange.end,
      });
    }
    // Blocks can sometimes end one index before their terminating semicolon
    // when really they should end exactly at that semicolon.
    let blockEnd = linesAndColumns.indexForLocation({
      line: node.locationData.last_line,
      column: node.locationData.last_column,
    });
    if (blockEnd === null) {
      throw new Error('Expected to find index for block end.');
    }
    if (source[blockEnd + 1] === ';') {
      blockEnd++;
      const loc = linesAndColumns.locationForIndex(blockEnd);
      if (loc === null) {
        throw new Error('Expected to find location for block end.');
      }
      node.locationData.last_line = loc.line;
      node.locationData.last_column = loc.column;
    }
    // The CS2 AST doesn't include the surrounding parens in a block, which can cause trouble with
    // things like postfix loops with parenthesized bodies. Expand every block to include any
    // surrounding parens.
    node.locationData = expandToIncludeParens(context, node.locationData);
  }

  if (node instanceof If) {
    const lastChild = node.elseBody || node.body;
    node.locationData = mergeLocations(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof For || node instanceof While) {
    const lastChild = node.body;
    if (lastChild) {
      node.locationData = mergeLocations(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Param) {
    if (!node.splat) {
      const lastChild = node.value || node.name;
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Code) {
    if (node.body) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        node.body.locationData
      );
    }
  }

  if (node instanceof Class) {
    const lastChild = node.body;
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof Switch) {
    const lastChild = node.otherwise || node.cases[node.cases.length - 1][1];
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof Try) {
    const lastChild =
      node.ensure || node.recovery || node.errorVariable || node.attempt;
    if (lastChild) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Extends) {
    const lastChild = node.parent;
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof Literal) {
    // Heregexp flags have an incorrect location, so detect that case and adjust
    // the end location to be correct.
    const endIndex = linesAndColumns.indexForLocation({
      line: node.locationData.last_line,
      column: node.locationData.last_column,
    });
    if (endIndex !== null) {
      const tokenIndex = context.sourceTokens.indexOfTokenNearSourceIndex(
        endIndex
      );
      const token = context.sourceTokens.tokenAtIndex(tokenIndex);
      if (token && token.type === SourceType.HEREGEXP_END) {
        const location = linesAndColumns.locationForIndex(token.end - 1);
        if (location) {
          node.locationData = {
            ...node.locationData,
            last_line: location.line,
            last_column: location.column,
          };
        }
      }
    }
  }
}
