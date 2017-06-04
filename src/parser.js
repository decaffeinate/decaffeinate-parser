import * as CoffeeScript from 'decaffeinate-coffeescript';
import ParseContext from './util/ParseContext';
import fixInvalidLocationData from './util/fixInvalidLocationData';
import lex from 'coffee-lex';
import locationWithLastPosition from './util/locationWithLastPosition';
import mapAny from './mappers/mapAny';
import mergeLocations from './util/mergeLocations';
import rangeOfBracketTokensForIndexNode from './util/rangeOfBracketTokensForIndexNode';
import type from './util/type';
import { inspect } from 'util';
import { patchCoffeeScript } from './ext/coffee-script';
import type { Program } from './nodes';

export function parse(source: string): Program {
  patchCoffeeScript();

  let context = ParseContext.fromSource(source, lex, CoffeeScript.nodes);

  let ast = context.ast;
  if (type(ast) === 'Block' && ast.expressions.every(e => type(e) === 'Comment')) {
    let program = {
      type: 'Program',
      line: 1,
      column: 1,
      raw: source,
      range: [0, 0],
      body: null
    };

    Object.defineProperty(program, 'context', { value: context });
    return program;
  }

  return convert(context);
}

function convert(context: ParseContext): Program {
  const { source, linesAndColumns } = context;
  fixLocations(context.ast);
  return makeProgramNode(context.ast);

  /**
   * @param {Object} node
   * @param ancestors
   */
  function fixLocations(node, ancestors = []) {
    node.eachChild(child => {
      if (child && child.locationData) {
        fixLocations(child, [node, ...ancestors]);
      }
    });

    node.locationData = fixInvalidLocationData(node.locationData, context.linesAndColumns);

    switch (type(node)) {
      case 'Value':
      {
        let lastChild = node.properties[node.properties.length - 1];
        if (lastChild) {
          node.locationData = locationWithLastPosition(
            node.locationData,
            lastChild.locationData
          );
        }
        break;
      }

      case 'Index':
      case 'Slice':
      {
        let rangeOfBrackets = rangeOfBracketTokensForIndexNode(context, node);
        let lbracket = context.sourceTokens.tokenAtIndex(rangeOfBrackets[0]);
        let lbracketLoc = linesAndColumns.locationForIndex(lbracket.start);
        let rbracket = context.sourceTokens.tokenAtIndex(rangeOfBrackets[1].previous());
        let rbracketLoc = linesAndColumns.locationForIndex(rbracket.start);
        node.locationData = {
          first_line: lbracketLoc.line,
          first_column: lbracketLoc.column,
          last_line: rbracketLoc.line,
          last_column: rbracketLoc.column
        };
        break;
      }

      case 'Access':
      case 'Arr':
      case 'Bool':
      case 'Comment':
      case 'Existence':
      case 'Expansion':
      case 'Literal':
      case 'Null':
      case 'Parens':
      case 'Range':
      case 'Return':
      case 'Splat':
      case 'Throw':
      case 'Undefined':
        break;

      case 'Obj':
      {
        let loc = node.locationData;
        let start = linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });
        let isImplicitObject = source[start] !== '{';
        if (isImplicitObject) {
          let lastChild = node.properties[node.properties.length - 1];
          node.locationData = locationWithLastPosition(
            node.locationData,
            lastChild.locationData
          );
        }
        break;
      }

      case 'Op':
      {
        let lastChild = node.second;
        if (lastChild) {
          node.locationData = locationWithLastPosition(
            node.locationData,
            lastChild.locationData
          );
        }
        break;
      }

      case 'Assign':
      {
        let lastChild = node.value;
        node.locationData = locationWithLastPosition(
          node.locationData,
          lastChild.locationData
        );
        break;
      }

      case 'In':
      {
        let lastChild = node.array;
        node.locationData = locationWithLastPosition(
          node.locationData,
          lastChild.locationData
        );
        break;
      }

      case 'Call':
      {
        if (node.variable && !node.do) {
          // `super` won't have a callee (i.e. `node.variable`)
          let calleeLoc = node.variable.locationData;
          let calleeEnd = linesAndColumns.indexForLocation({ line: calleeLoc.last_line, column: calleeLoc.last_column }) + 1;
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
        break;
      }

      case 'Block':
      {
        let lastChild = node.expressions[node.expressions.length - 1];
        if (lastChild) {
          node.locationData = locationWithLastPosition(
            node.locationData,
            lastChild.locationData
          );
        }
        break;
      }

      case 'If':
      {
        let lastChild = node.elseBody || node.body;
        node.locationData = mergeLocations(
          node.locationData,
          lastChild.locationData
        );
        break;
      }

      case 'For':
      case 'While':
      {
        let lastChild = node.body;
        node.locationData = mergeLocations(
          node.locationData,
          lastChild.locationData
        );
        break;
      }

      case 'Param':
      {
        if (!node.splat) {
          let lastChild = node.value || node.name;
          node.locationData = locationWithLastPosition(
            node.locationData,
            lastChild.locationData
          );
        }
        break;
      }

      case 'Code':
      {
        if (node.body) {
          node.locationData = locationWithLastPosition(
            node.locationData,
            node.body.locationData
          );
        }
        break;
      }

      case 'Class':
      {
        let lastChild = node.body;
        node.locationData = locationWithLastPosition(
          node.locationData,
          lastChild.locationData
        );
        break;
      }

      case 'Switch':
      {
        let lastChild = node.otherwise || node.cases[node.cases.length - 1][1];
        node.locationData = locationWithLastPosition(
          node.locationData,
          lastChild.locationData
        );
        break;
      }

      case 'Try':
      {
        let lastChild = node.ensure || node.recovery || node.errorVariable || node.attempt;
        node.locationData = locationWithLastPosition(
          node.locationData,
          lastChild.locationData
        );
        break;
      }

      case 'Extends':
      {
        let lastChild = node.parent;
        node.locationData = locationWithLastPosition(
          node.locationData,
          lastChild.locationData
        );
        break;
      }

      default:
        throw new Error(
          `cannot fix location data for ${type(node)} at ` +
          `${node.locationData.first_line + 1}:${node.locationData.first_column + 1}: ` +
          inspect(node)
        );
    }
  }

  function makeProgramNode(blockNode) {
    let programNode = {
      type: 'Program',
      line: 1,
      column: 1,
      range: [0, source.length],
      raw: source,
      body: mapAny(context, blockNode),
    };
    Object.defineProperty(programNode, 'context', {
      value: context,
      enumerable: false
    });
    return programNode;
  }
}
