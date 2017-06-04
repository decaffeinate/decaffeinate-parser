import { Assign, Base, Block, Call, Class, Code, Extends, For, If, In, Index, Obj, Op, Param, Slice, Switch, Try, Value, While } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import fixInvalidLocationData from './fixInvalidLocationData';
import locationWithLastPosition from './locationWithLastPosition';
import mergeLocations from './mergeLocations';
import ParseContext from './ParseContext';
import rangeOfBracketTokensForIndexNode from './rangeOfBracketTokensForIndexNode';

export default function fixLocations(context: ParseContext, node: Base) {
  let { linesAndColumns, source } = context;
  node.eachChild(child => {
    if (child && child.locationData) {
      fixLocations(context, child);
    }
    return undefined;
  });

  node.locationData = fixInvalidLocationData(node.locationData, context.linesAndColumns);

  if (node instanceof Value) {
    let lastChild = node.properties[node.properties.length - 1];
    if (lastChild) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Index || node instanceof Slice) {
    let rangeOfBrackets = rangeOfBracketTokensForIndexNode(context, node);
    let lbracket = context.sourceTokens.tokenAtIndex(rangeOfBrackets[0]);
    if (lbracket === null) {
      throw new Error('Expected to find left-bracket token.');
    }
    let lbracketLoc = linesAndColumns.locationForIndex(lbracket.start);
    if (lbracketLoc === null) {
      throw new Error('Expected to find a location for the left-bracket token.');
    }
    let rbracketIndex = rangeOfBrackets[1].previous();
    if (rbracketIndex === null) {
      throw new Error('Expected to find a non-null right-bracket token index.');
    }
    let rbracket = context.sourceTokens.tokenAtIndex(rbracketIndex);
    if (rbracket === null) {
      throw new Error('Expected to find right-bracket token.');
    }
    let rbracketLoc = linesAndColumns.locationForIndex(rbracket.start);
    if (rbracketLoc === null) {
      throw new Error('Expected to find a location for the right-bracket token.');
    }
    node.locationData = {
      first_line: lbracketLoc.line,
      first_column: lbracketLoc.column,
      last_line: rbracketLoc.line,
      last_column: rbracketLoc.column
    };
  }

  if (node instanceof Obj) {
    let loc = node.locationData;
    let start = linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });
    if (start === null) {
      throw new Error('Expected to find a start index for object.');
    }
    let isImplicitObject = source[start] !== '{';
    if (isImplicitObject) {
      let lastChild = node.properties[node.properties.length - 1];
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Op) {
    let lastChild = node.second;
    if (lastChild) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Assign) {
    let lastChild = node.value;
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof In) {
    let lastChild = node.array;
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof Call) {
    if (node.variable && !node.do) {
      // `super` won't have a callee (i.e. `node.variable`)
      let calleeLoc = node.variable.locationData;
      let calleeEnd = linesAndColumns.indexForLocation({
        line: calleeLoc.last_line,
        column: calleeLoc.last_column
      });
      if (calleeEnd === null) {
        throw new Error('Expected to find index for callee end.');
      }
      calleeEnd++;
      // Account for soaked calls, e.g. `a?()`.
      if (source[calleeEnd] === '?') { calleeEnd += 1; }
      let isImplicitCall = source[calleeEnd] !== '(';
      if (isImplicitCall) {
        let lastChild = node.args[node.args.length - 1] || node.variable;
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
    let lastChild = node.expressions[node.expressions.length - 1];
    if (lastChild) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof If) {
    let lastChild = node.elseBody || node.body;
    node.locationData = mergeLocations(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof For || node instanceof While) {
    let lastChild = node.body;
    if (lastChild) {
      node.locationData = mergeLocations(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Param) {
    if (!node.splat) {
      let lastChild = node.value || node.name;
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
    let lastChild = node.body;
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof Switch) {
    let lastChild = node.otherwise || node.cases[node.cases.length - 1][1];
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }

  if (node instanceof Try) {
    let lastChild = node.ensure || node.recovery || node.errorVariable || node.attempt;
    if (lastChild) {
      node.locationData = locationWithLastPosition(
        node.locationData,
        lastChild.locationData
      );
    }
  }

  if (node instanceof Extends) {
    let lastChild = node.parent;
    node.locationData = locationWithLastPosition(
      node.locationData,
      lastChild.locationData
    );
  }
}
