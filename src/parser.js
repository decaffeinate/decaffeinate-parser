import * as CoffeeScript from 'decaffeinate-coffeescript';
import ParseContext from './util/ParseContext';
import expandLocationLeftThrough from './util/expandLocationLeftThrough';
import isChainedComparison from './util/isChainedComparison';
import isHeregexTemplateNode from './util/isHeregexTemplateNode';
import isImplicitPlusOp from './util/isImplicitPlusOp';
import isInterpolatedString from './util/isInterpolatedString';
import fixInvalidLocationData from './util/fixInvalidLocationData';
import lex, { SourceType } from 'coffee-lex';
import locationsEqual from './util/locationsEqual';
import locationContainingNodes from './util/locationContainingNodes';
import locationWithLastPosition from './util/locationWithLastPosition';
import makeNode, { RegexFlags } from './nodes';
import mapAny from './mappers/mapAny';
import mapAnyWithFallback from './mappers/mapAnyWithFallback';
import mergeLocations from './util/mergeLocations';
import parseString from './util/parseString';
import rangeOfBracketTokensForIndexNode from './util/rangeOfBracketTokensForIndexNode';
import type from './util/type';
import { inspect } from 'util';
import { patchCoffeeScript } from './ext/coffee-script';

/**
 * @param {string} source
 * @returns {Program}
 */
export function parse(source) {
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
    return /** @type Program */ program;
  }

  return /** @type Program */ convert(context);
}

/**
 * @param {ParseContext} context
 * @returns {Node}
 */
function convert(context) {
  const { source, linesAndColumns } = context;
  fixLocations(context.ast);
  return convertNode(context.ast);

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
        if (node.variable) {
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

  /**
   * @param {Object} node
   * @param ancestors
   * @returns {Node}
   */
  function convertNode(node, ancestors = []) {
    if (ancestors.length === 0) {
      let programNode = {
        type: 'Program',
        line: 1,
        column: 1,
        range: [0, source.length],
        raw: source,
        body: makeNode(context, 'Block', node.locationData, {
          statements: convertChild(node.expressions)
        })
      };
      Object.defineProperty(programNode, 'context', {
        value: context,
        enumerable: false
      });
      return programNode;
    }

    switch (type(node)) {
      case 'Literal':
        return mapAnyWithFallback(context, node, () =>
          makeNode(context, 'Identifier', node.locationData, {
            data: node.value
          })
        );

      case 'Value': {
        return mapAnyWithFallback(context, node, () => {
          let value = convertChild(node.base);
          node.properties.forEach(prop => {
            value = accessOpForProperty(value, prop, node.base.locationData);
            if (value.type === 'MemberAccessOp' && value.expression.type === 'MemberAccessOp') {
              if (value.expression.memberName === 'prototype' && value.expression.raw.slice(-2) === '::') {
                // Un-expand shorthand prototype access.
                value = {
                  type: 'ProtoMemberAccessOp',
                  line: value.line,
                  column: value.column,
                  range: value.range,
                  raw: value.raw,
                  expression: value.expression.expression,
                  memberName: value.memberName
                };
              }
            }
          });
          return value;
        });
      }

      case 'Call':
        if (isHeregexTemplateNode(node, context)) {
          let firstArgOp = convertOperator(node.args[0].base.body.expressions[0]);
          let heregexResult = createTemplateLiteral(firstArgOp, 'Heregex');
          let flags;
          if (node.args.length > 1) {
            flags = parseString(node.args[1].base.value);
          } else {
            flags = '';
          }
          heregexResult.flags = RegexFlags.parse(flags);
          return heregexResult;
        }

        if (node.isNew) {
          return makeNode(context, 'NewOp', expandLocationLeftThrough(context, node.locationData, 'new'), {
            ctor: convertChild(node.variable),
            arguments: convertChild(node.args)
          });
        } else if (node.isSuper) {
          if (node.args.length === 1 && type(node.args[0]) === 'Splat' && locationsEqual(node.args[0].locationData, node.locationData)) {
            // Virtual splat argument.
            return makeNode(context, 'FunctionApplication', node.locationData, {
              function: makeNode(context, 'Super', node.locationData),
              arguments: [{
                type: 'Spread',
                virtual: true,
                expression: {
                  type: 'Identifier',
                  data: 'arguments',
                  virtual: true
                }
              }]
            });
          }
          const superLocationData = {
            first_line: node.locationData.first_line,
            first_column: node.locationData.first_column,
            last_line: node.locationData.first_line,
            last_column: node.locationData.first_column + 'super'.length - 1
          };
          return makeNode(context, 'FunctionApplication', node.locationData, {
            function: makeNode(context, 'Super', superLocationData),
            arguments: convertChild(node.args)
          });
        } else {
          const result = makeNode(context, node.soak ? 'SoakedFunctionApplication' : 'FunctionApplication', node.locationData, {
            function: convertChild(node.variable),
            arguments: convertChild(node.args)
          });

          if (node.do) {
            result.type = 'DoOp';
            result.expression = result.function;
            // The argument to `do` may not always be a function literal.
            if (result.expression.parameters) {
              result.expression.parameters = result.expression.parameters.map((param, i) => {
                const arg = result.arguments[i];

                // If there's a parameter with no default, CoffeeScript will insert a fake
                // arg with the same value and location.
                if (arg.type === 'Identifier' && arg.data === param.data &&
                    arg.range[0] === param.range[0] && arg.range[1] === param.range[1]) {
                  return param;
                }

                return makeNode(context, 'DefaultParam', locationContainingNodes(node.args[i], node.variable.params[i]), {
                  param,
                  default: arg
                });
              });
            }
            delete result.function;
            delete result.arguments;
          }

          return result;
        }

      case 'Op': {
        const op = convertOperator(node);
        if (isImplicitPlusOp(op, context) && isInterpolatedString(node, ancestors, context)) {
          return createTemplateLiteral(op, 'String');
        }
        if (isChainedComparison(node) && !isChainedComparison(ancestors[ancestors.length - 1])) {
          return makeNode(context, 'ChainedComparisonOp', node.locationData, {
            expression: op
          });
        }
        return op;
      }

      case 'Assign':
        if (node.context === 'object') {
          return makeNode(context, 'ObjectInitialiserMember', node.locationData, {
            key: convertChild(node.variable),
            expression: convertChild(node.value)
          });
        } else if (node.context && node.context.slice(-1) === '=') {
          return makeNode(context, 'CompoundAssignOp', node.locationData, {
            assignee: convertChild(node.variable),
            expression: convertChild(node.value),
            op: binaryOperatorNodeType(node.context.slice(0, -1))
          })
        } else {
          return makeNode(context, 'AssignOp', node.locationData, {
            assignee: convertChild(node.variable),
            expression: convertChild(node.value)
          });
        }

      case 'Obj':
        return makeNode(context, 'ObjectInitialiser', node.locationData, {
          members: node.properties.map(property => {
            if (type(property) === 'Value') {
              // shorthand property
              const keyValue = convertChild(property);
              return makeNode(context, 'ObjectInitialiserMember', property.locationData, {
                key: keyValue,
                expression: keyValue
              });
            }

            return convertChild(property);
          }).filter(node => node)
        });

      case 'Arr':
        return makeNode(context, 'ArrayInitialiser', node.locationData, {
          members: convertChild(node.objects)
        });

      case 'Parens':
        if (type(node.body) === 'Block') {
          const expressions = node.body.expressions;
          if (expressions.length === 1) {
            return convertChild(expressions[0]);
          } else {
            const lastExpression = expressions[expressions.length - 1];
            let result = convertChild(lastExpression);
            for (let i = expressions.length - 2; i >= 0; i--) {
              let left = expressions[i];
              result = makeNode(context, 'SeqOp', locationContainingNodes(left, lastExpression), {
                left: convertChild(left),
                right: result
              });
            }
            return result;
          }
        } else {
          return convertChild(node.body);
        }

      case 'If': {
        let condition = convertChild(node.condition);
        let consequent = convertChild(node.body);
        let alternate = convertChild(node.elseBody);
        let isUnless = false;

        if (consequent && consequent.range[0] < condition.range[0]) {
          // POST-if, so look for tokens between the consequent and the condition
          consequent.inline = true;
          let lastConsequentTokenIndex = context.sourceTokens.indexOfTokenEndingAtSourceIndex(consequent.range[1]);
          let firstConditionTokenIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(condition.range[0]);

          for (let i = lastConsequentTokenIndex; i !== firstConditionTokenIndex; i = i.next()) {
            let token = context.sourceTokens.tokenAtIndex(i);
            if (token.type === SourceType.IF) {
              isUnless = source.slice(token.start, token.end) === 'unless';
              break;
            }
          }
        } else {
          // Regular `if`, so look at the start of the node.
          let firstConditionTokenIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(condition.range[0]);

          for (let i = firstConditionTokenIndex; i !== null; i = i.previous()) {
            let token = context.sourceTokens.tokenAtIndex(i);
            if (token.type === SourceType.IF) {
              isUnless = source.slice(token.start, token.end) === 'unless';
              break;
            }
          }
        }

        return makeNode(context, 'Conditional', node.locationData, {
          isUnless,
          condition,
          consequent,
          alternate
        });
      }

      case 'Code': {
        let fnType;
        if (node.bound) {
          if (node.isGenerator) {
            fnType = 'BoundGeneratorFunction';
          } else {
            fnType = 'BoundFunction';
          }
        } else {
          if (node.isGenerator) {
            fnType = 'GeneratorFunction';
          } else {
            fnType = 'Function';
          }
        }
        return makeNode(context, fnType, node.locationData, {
          body: convertChild(node.body),
          parameters: convertChild(node.params)
        });
      }

      case 'Param': {
        const param = convertChild(node.name);
        if (node.value) {
          return makeNode(context, 'DefaultParam', node.locationData, {
            default: convertChild(node.value),
            param
          });
        }
        if (node.splat) {
          return makeNode(context, 'Rest', node.locationData, {
            expression: param
          });
        }
        return param;
      }

      case 'Block':
        if (node.expressions.length === 0) {
          return null;
        } else {
          const block = makeNode(context, 'Block', node.locationData, {
            statements: convertChild(node.expressions)
          });
          block.inline = false;
          for (let i = block.range[0] - 1; i >= 0; i--) {
            const char = source[i];
            if (char === '\n') {
              break;
            } else if (char !== ' ' && char !== '\t') {
              block.inline = true;
              break;
            }
          }
          return block;
        }

      case 'Return':
        return makeNode(context, 'Return', node.locationData, {
          expression: node.expression ? convertChild(node.expression) : null
        });

      case 'For':
        if (locationsEqual(node.body.locationData, node.locationData)) {
          node.body.locationData = locationContainingNodes(...node.body.expressions);
        }
        if (node.object) {
          return makeNode(context, 'ForOf', node.locationData, {
            keyAssignee: convertChild(node.index),
            valAssignee: convertChild(node.name),
            body: convertChild(node.body),
            target: convertChild(node.source),
            filter: convertChild(node.guard),
            isOwn: node.own
          });
        } else {
          return makeNode(context, 'ForIn', node.locationData, {
            keyAssignee: convertChild(node.index),
            valAssignee: convertChild(node.name),
            body: convertChild(node.body),
            target: convertChild(node.source),
            filter: convertChild(node.guard),
            step: convertChild(node.step)
          });
        }

      case 'While': {
        let start = linesAndColumns.indexForLocation({ line: node.locationData.first_line, column: node.locationData.first_column });
        let tokens = context.sourceTokens;
        let startTokenIndex = tokens.indexOfTokenContainingSourceIndex(start);
        let startTokenType = tokens.tokenAtIndex(startTokenIndex).type;

        if (startTokenType === SourceType.LOOP) {
          return makeNode(context, 'Loop', locationContainingNodes(node, node.body), {
            body: convertChild(node.body)
          });
        }

        return makeNode(context, 'While', locationContainingNodes(node, node.condition, node.body), {
          condition: convertChild(node.condition),
          guard: convertChild(node.guard),
          body: convertChild(node.body),
          isUntil: node.condition.inverted === true
        });
      }

      case 'Existence':
        return makeNode(context, 'UnaryExistsOp', node.locationData, {
          expression: convertChild(node.expression)
        });

      case 'Class': {
        const nameNode = node.variable ? convertChild(node.variable) : null;

        let ctor = null;
        let boundMembers = [];
        const body = (!node.body || node.body.expressions.length === 0) ? null : makeNode(context, 'Block', node.body.locationData, {
          statements: node.body.expressions.reduce((statements, expr) => {
            if (type(expr) === 'Value' && type(expr.base) === 'Obj') {
              expr.base.properties.forEach(property => {
                let key;
                let value;
                switch (type(property)) {
                  case 'Value':
                    // shorthand property
                    key = value = convertChild(property);
                    break;

                  case 'Comment':
                    return;

                  default:
                    key = convertChild(property.variable);
                    value = convertChild(property.value);
                    break;
                }
                if (key.data === 'constructor') {
                  statements.push(ctor = makeNode(context, 'Constructor', property.locationData, {
                    assignee: key,
                    expression: value
                  }));
                } else if (key.type === 'MemberAccessOp' && key.expression.type === 'This') {
                  statements.push(makeNode(context, 'AssignOp', property.locationData, {
                    assignee: key,
                    expression: value
                  }));
                } else {
                  statements.push(makeNode(context, 'ClassProtoAssignOp', property.locationData, {
                    assignee: key,
                    expression: value
                  }));
                }
                if (value.type === 'BoundFunction') {
                  boundMembers.push(statements[statements.length - 1]);
                }
              });
            } else {
              statements.push(convertChild(expr));
            }
            return statements;
          }, [])
        });

        return makeNode(context, 'Class', node.locationData, {
          name: nameNode,
          nameAssignee: nameNode,
          body,
          boundMembers,
          parent: node.parent ? convertChild(node.parent) : null,
          ctor
        });
      }

      case 'Switch':
        return makeNode(context, 'Switch', node.locationData, {
          expression: convertChild(node.subject),
          cases: node.cases.map(([conditions, body]) => {
            if (!Array.isArray(conditions)) {
              conditions = [conditions];
            }
            const loc = expandLocationLeftThrough(
              context,
              locationContainingNodes(conditions[0], body),
              'when '
            );
            return makeNode(context, 'SwitchCase', loc, {
              conditions: convertChild(conditions),
              consequent: convertChild(body)
            })
          }).filter(node => node),
          alternate: convertChild(node.otherwise)
        });

      case 'Splat':
        return makeNode(context, 'Spread', node.locationData, {
          expression: convertChild(node.name)
        });

      case 'Throw':
        return mapAnyWithFallback(context, node, () =>
          makeNode(context, 'Throw', node.locationData, {
            expression: convertChild(node.expression)
          })
        );

      case 'Try':
        return makeNode(context, 'Try', node.locationData, {
          body: convertChild(node.attempt),
          catchAssignee: convertChild(node.errorVariable),
          catchBody: convertChild(node.recovery),
          finallyBody: convertChild(node.ensure)
        });

      case 'Range':
        return makeNode(context, 'Range', node.locationData, {
          left: convertChild(node.from),
          right: convertChild(node.to),
          isInclusive: !node.exclusive
        });

      case 'In': {
        // We don't use the `negated` flag on `node` because it gets set to
        // `true` when a parent `If` is an `unless`.
        let left = convertChild(node.object);
        let right = convertChild(node.array);
        let isNot = false;

        let lastTokenIndexOfLeft = context.sourceTokens.indexOfTokenEndingAtSourceIndex(left.range[1]);
        let firstTokenIndexOfRight = context.sourceTokens.indexOfTokenStartingAtSourceIndex(right.range[0]);

        for (let i = lastTokenIndexOfLeft.next(); i !== firstTokenIndexOfRight; i = i.next()) {
          let token = context.sourceTokens.tokenAtIndex(i);
          if (token.type === SourceType.RELATION) {
            isNot = source.slice(token.start, token.end) !== 'in';
          }
        }

        return makeNode(context, 'InOp', node.locationData, {
          left,
          right,
          isNot
        });
      }

      case 'Expansion':
        return makeNode(context, 'Expansion', node.locationData);

      case 'Comment':
        return null;

      case 'Extends':
        return makeNode(context, 'ExtendsOp', node.locationData, {
          left: convertChild(node.child),
          right: convertChild(node.parent)
        });

      default:
        return mapAny(context, node);
    }

    function convertChild(child) {
      if (!child) {
        return null;
      } else if (Array.isArray(child)) {
        return child.map(convertChild).filter(node => node);
      } else {
        return convertNode(child, [...ancestors, node]);
      }
    }

    function createTemplateLiteral(op, nodeType) {
      let tokens = context.sourceTokens;
      let startTokenIndex = tokens.indexOfTokenContainingSourceIndex(op.range[0]);
      let interpolatedStringTokenRange = tokens.rangeOfInterpolatedStringTokensContainingTokenIndex(startTokenIndex);
      if (!interpolatedStringTokenRange) {
        throw new Error('cannot find interpolation end for node');
      }
      let firstToken = tokens.tokenAtIndex(interpolatedStringTokenRange[0]);
      let lastToken = tokens.tokenAtIndex(interpolatedStringTokenRange[1].previous());
      op.type = nodeType;
      op.range = [firstToken.start, lastToken.end];
      op.raw = source.slice(...op.range);

      let elements = [];

      function addElements({ left, right }) {
        if (isImplicitPlusOp(left, context)) {
          addElements(left);
        } else {
          elements.push(left);
        }
        elements.push(right);
      }
      addElements(op);

      let quasis = [];
      let expressions = [];
      let quote = op.raw.slice(0, 3) === '"""' ? '"""' : '"';

      function findNextToken(position, tokenType) {
        let tokens = context.sourceTokens;
        let startTokenIndex = tokens.indexOfTokenNearSourceIndex(position);
        let tokenIndex = tokens.indexOfTokenMatchingPredicate(
          token => token.type === tokenType, startTokenIndex);
        return tokens.tokenAtIndex(tokenIndex);
      }

      function findPrevToken(position, tokenType) {
        let tokens = context.sourceTokens;
        let startTokenIndex = tokens.indexOfTokenNearSourceIndex(position);
        let tokenIndex = tokens.lastIndexOfTokenMatchingPredicate(
          token => token.type === tokenType, startTokenIndex);
        return tokens.tokenAtIndex(tokenIndex);
      }

      function buildFirstQuasi() {
        // Find the start of the first interpolation, i.e. "#{a}".
        //                                                  ^
        let interpolationStart = findNextToken(op.range[0], SourceType.INTERPOLATION_START);
        let range = [op.range[0], interpolationStart.start];
        return buildQuasi(range);
      }

      function buildLastQuasi() {
        // Find the close of the last interpolation, i.e. "a#{b}".
        //                                                     ^
        let interpolationEnd = findPrevToken(op.range[1] - 1, SourceType.INTERPOLATION_END);
        return buildQuasi([interpolationEnd.end, op.range[1]]);
      }

      function buildQuasi(range) {
        let loc = linesAndColumns.locationForIndex(range[0]);
        return {
          type: 'Quasi',
          data: '',
          raw: source.slice(...range),
          line: loc.line + 1,
          column: loc.column + 1,
          range
        };
      }

      function buildQuasiWithString(range, raw){
        let loc = linesAndColumns.locationForIndex(range[0]);
        return {
          type: 'Quasi',
          data: raw,
          raw: source.slice(...range),
          line: loc.line + 1,
          column: loc.column ,
          range
        };
      }

      elements.forEach((element, i) => {
        if (i === 0) {
          if (element.type === 'String') {
            if (element.range[0] === op.range[0]) {
              // This string is not interpolated, it's part of the string interpolation.
              if (element.data === '' && element.raw.length > quote.length) {
                // CoffeeScript includes the `#` in the raw value of a leading
                // empty quasi string, but it shouldn't be there.
                element = buildFirstQuasi();
              }
              quasis.push(element);
              return;
            }
          }
        }

        if (element.type === 'Quasi') {
          quasis.push(element);
        } else {
          if (quasis.length === 0) {
            // This element is interpolated and is first, i.e. "#{a}".
            quasis.push(buildFirstQuasi());
            expressions.push(element);
          } else if (/^"(.*?)"$/.test(element.data)) {
            quasis.push(buildQuasiWithString(element.range, element.raw));
          } else if (quasis.length < expressions.length + 1) {
            let lastInterpolationEnd = findPrevToken(element.range[0], SourceType.INTERPOLATION_END);
            let lastInterpolationStart = findPrevToken(element.range[0], SourceType.INTERPOLATION_START);
            quasis.push(buildQuasi([lastInterpolationEnd.end, lastInterpolationStart.start]));
            expressions.push(element);
          } else {
            expressions.push(element);
          }
        }


      });

      if (quasis.length < expressions.length + 1) {
        quasis.push(buildLastQuasi());
      }

      op.quasis = quasis;
      op.expressions = expressions;
      delete op.left;
      delete op.right;
      return op;
    }

    /**
     * @param expression converted base
     * @param prop CS node to convertNode
     * @param loc CS location data for original base
     */
    function accessOpForProperty(expression, prop, loc) {
      switch (type(prop)) {
        case 'Access':
          return makeNode(context, prop.soak ? 'SoakedMemberAccessOp' : 'MemberAccessOp', mergeLocations(loc, prop.locationData), {
            expression,
            memberName: prop.name.value.valueOf()
          });

        case 'Index':
          return makeNode(context, prop.soak ? 'SoakedDynamicMemberAccessOp' : 'DynamicMemberAccessOp', mergeLocations(loc, prop.locationData), {
            expression,
            indexingExpr: convertNode(prop.index, [...ancestors, node, prop])
          });

        case 'Slice':
          return makeNode(context, 'Slice', mergeLocations(loc, prop.locationData), {
            expression,
            left: convertChild(prop.range.from),
            right: convertChild(prop.range.to),
            isInclusive: !prop.range.exclusive
          });


        default:
          throw new Error(`unknown property type: ${type(prop)}\n${JSON.stringify(prop, null, 2)}`)
      }
    }

    function binaryOperatorNodeType(operator) {
      switch (operator) {
        case '===':
          return 'EQOp';

        case '!==':
          return 'NEQOp';

        case '&&':
          return 'LogicalAndOp';

        case '||':
          return 'LogicalOrOp';

        case '+':
          return 'PlusOp';

        case '-':
          return 'SubtractOp';

        case '*':
          return 'MultiplyOp';

        case '/':
          return 'DivideOp';

        case '%':
          return 'RemOp';

        case '%%':
          return 'ModuloOp';

        case '&':
          return 'BitAndOp';

        case '|':
          return 'BitOrOp';

        case '^':
          return 'BitXorOp';

        case '<':
          return 'LTOp';

        case '>':
          return 'GTOp';

        case '<=':
          return 'LTEOp';

        case '>=':
          return 'GTEOp';

        case 'in':
          return 'OfOp';

        case '?':
          return 'ExistsOp';

        case 'instanceof':
          return 'InstanceofOp';

        case '<<':
          return 'LeftShiftOp';

        case '>>':
          return 'SignedRightShiftOp';

        case '>>>':
          return 'UnsignedRightShiftOp';

        case '**':
          return 'ExpOp';

        case '//':
          return 'FloorDivideOp';

        default:
          return null;
      }
    }

    function convertOperator(op) {
      let nodeType;

      if (op.second) {
        nodeType = binaryOperatorNodeType(op.operator);

        if (!nodeType) {
          throw new Error(`unknown binary operator: ${op.operator}`);
        }

        let result = makeNode(context, nodeType, op.locationData, {
          left: convertNode(op.first, [...ancestors, op]),
          right: convertNode(op.second, [...ancestors, op])
        });
        if (result.type === 'InstanceofOp' || result.type === 'OfOp') {
          let lastTokenIndexOfLeft = context.sourceTokens.indexOfTokenEndingAtSourceIndex(result.left.range[1]);
          let firstTokenIndexOfRight = context.sourceTokens.indexOfTokenStartingAtSourceIndex(result.right.range[0]);
          let isNot = false;

          for (let i = lastTokenIndexOfLeft.next(); i !== firstTokenIndexOfRight; i = i.next()) {
            let token = context.sourceTokens.tokenAtIndex(i);
            if (token.type === SourceType.OPERATOR || token.type === SourceType.RELATION) {
              isNot = source.slice(token.start, token.start + 'not'.length) === 'not';
              break;
            }
          }

          result.isNot = isNot;
        }
        return result;
      } else {
        switch (op.operator) {
          case '+':
            nodeType = 'UnaryPlusOp';
            break;

          case '-':
            nodeType = 'UnaryNegateOp';
            break;

          case 'typeof':
            nodeType = 'TypeofOp';
            break;

          case '!':
            nodeType = 'LogicalNotOp';
            break;

          case '~':
            nodeType = 'BitNotOp';
            break;

          case '--':
            nodeType = op.flip ? 'PostDecrementOp' : 'PreDecrementOp';
            break;

          case '++':
            nodeType = op.flip ? 'PostIncrementOp' : 'PreIncrementOp';
            break;

          case 'delete':
            nodeType = 'DeleteOp';
            break;

          case 'new':
            // Parentheses-less "new".
            return makeNode(context, 'NewOp', op.locationData, {
              ctor: convertChild(op.first),
              arguments: []
            });

          case 'yield':
            return makeNode(context, 'Yield', op.locationData, {
              expression: convertChild(op.first)
            });

          case 'yield*':
            return makeNode(context, 'YieldFrom', op.locationData, {
              expression: convertChild(op.first)
            });

          default:
            throw new Error(`unknown unary operator: ${op.operator}`);
        }

        return makeNode(context, nodeType, op.locationData, {
          expression: convertNode(op.first, [...ancestors, op])
        });
      }
    }
  }
}
