import * as CoffeeScript from 'decaffeinate-coffeescript';
import ParseContext from './util/ParseContext';
import isChainedComparison from './util/isChainedComparison';
import isImplicitPlusOp from './util/isImplicitPlusOp';
import isInterpolatedString from './util/isInterpolatedString';
import isStringAtPosition from './util/isStringAtPosition';
import fixInvalidLocationData from './util/fixInvalidLocationData';
import lex, { NEWLINE, COMMENT, HERECOMMENT, IF, RELATION, OPERATOR, LBRACKET, RBRACKET, STRING_CONTENT } from 'coffee-lex';
import locationsEqual from './util/locationsEqual';
import parseLiteral from './util/parseLiteral';
import type from './util/type';
import { inspect } from 'util';
import { patchCoffeeScript } from './ext/coffee-script';

const HEREGEX_PATTERN = /^\/\/\/((?:.|\n)*)\/\/\/([gimy]*)$/;

/**
 * @param {string} source
 * @param {{coffeeScript: {nodes: function(string): Object, tokens: function(string): Array}}} options
 * @returns {Program}
 */
export function parse(source, options={}) {
  let CS = options.coffeeScript || CoffeeScript;

  patchCoffeeScript(CS);

  let context = ParseContext.fromSource(source, lex, CS.nodes);

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

function locationContainingNodes(...nodes) {
  switch (nodes.length) {
    case 0:
      return null;

    case 1:
      return nodes[0].locationData;

    case 2:
      return mergeLocations(nodes[0].locationData, nodes[1].locationData);

    default:
      return mergeLocations(nodes[0].locationData, locationContainingNodes(...nodes.slice(1)));
  }
}

function locationWithLastPosition(loc, last) {
  return {
    first_line: loc.first_line,
    first_column: loc.first_column,
    last_line: last.last_line,
    last_column: last.last_column
  };
}

function mergeLocations(left, right) {
  let first_line;
  let first_column;
  let last_line;
  let last_column;

  if (left.first_line < right.first_line) {
    ({ first_line, first_column } = left);
  } else if (left.first_line > right.first_line) {
    ({ first_line, first_column } = right);
  } else if (left.first_column < right.first_column) {
    ({ first_line, first_column } = left);
  } else {
    ({ first_line, first_column } = right);
  }

  if (left.last_line < right.last_line) {
    ({ last_line, last_column } = right);
  } else if (left.last_line > right.last_line) {
    ({ last_line, last_column } = left);
  } else if (left.last_column < right.last_column) {
    ({ last_line, last_column } = right);
  } else {
    ({ last_line, last_column } = left);
  }

  return { first_line, first_column, last_line, last_column };
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
        let rangeOfBrackets = rangeOfBracketTokensForIndexNode(node);
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

  function rangeOfBracketTokensForIndexNode(indexNode) {
    let start = linesAndColumns.indexForLocation({ line: indexNode.locationData.first_line, column: indexNode.locationData.first_column });
    let startTokenIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(start);
    let range = context.sourceTokens.rangeOfMatchingTokensContainingTokenIndex(LBRACKET, RBRACKET, startTokenIndex);
    if (!range) {
      throw new Error(
        `cannot find braces surrounding index at ` +
        `${indexNode.locationData.first_line + 1}:${indexNode.locationData.first_column}: ` +
        `${inspect(indexNode)}`
      );
    }
    return range;
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
        body: makeNode('Block', node.locationData, {
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
      case 'Value':
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

      case 'Literal':
        if (node.value === 'this') {
          return makeNode('This', node.locationData);
        } else {
          let start = linesAndColumns.indexForLocation({ line: node.locationData.first_line, column: node.locationData.first_column });
          let end = linesAndColumns.indexForLocation({ line: node.locationData.last_line, column: node.locationData.last_column }) + 1;
          let raw = source.slice(start, end);
          let literal = parseLiteral(node.value);

          if (!literal) {
            if (raw[0] === '`' && raw[raw.length - 1] === '`') {
              return makeNode('JavaScript', node.locationData, { data: node.value });
            } else if (raw.slice(0, '///'.length) === '///') {
              let flags = raw.match(HEREGEX_PATTERN)[2];
              return makeNode('RegExp', node.locationData, {
                data: node.value,
                flags: ['g', 'i', 'm', 'y'].reduce((memo, flag) => {
                  memo[flag] = flags.indexOf(flag) >= 0;
                  return memo;
                }, {})
              });
            }
            return makeNode('Identifier', node.locationData, { data: node.value });
          } else if (literal.type === 'error') {
            throw new Error(literal.error.message);
          } else if (literal.type === 'string') {
            // Top-level strings should all be in the same format: an array of
            // quasis and expressions. For a normal string literal, this is the
            // simple case of one quasi and no expressions. But if this string
            // is actually a quasi that CoffeeScript is calling a string, then
            // just return a Quasi node, and higher-up code should insert it
            // into a string interpolation.
            if (isStringAtPosition(start, end, context)) {
              return makeNode('String', node.locationData, {
                quasis: [
                  makeNode('Quasi', node.locationData, {data: literal.data})
                ],
                expressions: [],
              });
            } else {
              return makeNode('Quasi', node.locationData, {data: literal.data});
            }
          } else if (literal.type === 'int') {
            return makeNode('Int', node.locationData, { data: literal.data });
          } else if (literal.type === 'float') {
            return makeNode('Float', node.locationData, { data: literal.data });
          } else {
            throw new Error(`unknown literal type for value: ${JSON.stringify(literal)}`);
          }
        }

      case 'Call':
        if (node.isNew) {
          return makeNode('NewOp', expandLocationLeftThrough(node.locationData, 'new'), {
            ctor: convertChild(node.variable),
            arguments: convertChild(node.args)
          });
        } else if (node.isSuper) {
          if (node.args.length === 1 && type(node.args[0]) === 'Splat' && locationsEqual(node.args[0].locationData, node.locationData)) {
            // Virtual splat argument.
            return makeNode('FunctionApplication', node.locationData, {
              function: makeNode('Super', node.locationData),
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
          return makeNode('FunctionApplication', node.locationData, {
            function: makeNode('Super', superLocationData),
            arguments: convertChild(node.args)
          });
        } else {
          const result = makeNode(node.soak ? 'SoakedFunctionApplication' : 'FunctionApplication', node.locationData, {
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

                return makeNode('DefaultParam', locationContainingNodes(node.args[i], node.variable.params[i]), {
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

      case 'Op':
        const op = convertOperator(node);
        if (isImplicitPlusOp(op, context) && isInterpolatedString(node, ancestors, context)) {
          return createTemplateLiteral(op);
        }
        if (isChainedComparison(node) && !isChainedComparison(ancestors[ancestors.length - 1])) {
          return makeNode('ChainedComparisonOp', node.locationData, {
            expression: op
          });
        }
        return op;

      case 'Assign':
        if (node.context === 'object') {
          return makeNode('ObjectInitialiserMember', node.locationData, {
            key: convertChild(node.variable),
            expression: convertChild(node.value)
          });
        } else if (node.context && node.context.slice(-1) === '=') {
          return makeNode('CompoundAssignOp', node.locationData, {
            assignee: convertChild(node.variable),
            expression: convertChild(node.value),
            op: binaryOperatorNodeType(node.context.slice(0, -1))
          })
        } else {
          return makeNode('AssignOp', node.locationData, {
            assignee: convertChild(node.variable),
            expression: convertChild(node.value)
          });
        }

      case 'Obj':
        return makeNode('ObjectInitialiser', node.locationData, {
          members: node.properties.map(property => {
            if (type(property) === 'Value') {
              // shorthand property
              const keyValue = convertChild(property);
              return makeNode('ObjectInitialiserMember', property.locationData, {
                key: keyValue,
                expression: keyValue
              });
            }

            return convertChild(property);
          }).filter(node => node)
        });

      case 'Arr':
        return makeNode('ArrayInitialiser', node.locationData, {
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
              result = makeNode('SeqOp', locationContainingNodes(left, lastExpression), {
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
            if (token.type === IF) {
              isUnless = source.slice(token.start, token.end) === 'unless';
              break;
            }
          }
        } else {
          // Regular `if`, so look at the start of the node.
          let firstConditionTokenIndex = context.sourceTokens.indexOfTokenStartingAtSourceIndex(condition.range[0]);

          for (let i = firstConditionTokenIndex; i !== null; i = i.previous()) {
            let token = context.sourceTokens.tokenAtIndex(i);
            if (token.type === IF) {
              isUnless = source.slice(token.start, token.end) === 'unless';
              break;
            }
          }
        }

        return makeNode('Conditional', node.locationData, {
          isUnless,
          condition,
          consequent,
          alternate
        });
      }

      case 'Code':
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
        return makeNode(fnType, node.locationData, {
          body: convertChild(node.body),
          parameters: convertChild(node.params)
        });

      case 'Param':
        const param = convertChild(node.name);
        if (node.value) {
          return makeNode('DefaultParam', node.locationData, {
            default: convertChild(node.value),
            param
          });
        }
        if (node.splat) {
          return makeNode('Rest', node.locationData, {
            expression: param
          });
        }
        return param;

      case 'Block':
        if (node.expressions.length === 0) {
          return null;
        } else {
          const block = makeNode('Block', node.locationData, {
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

      case 'Bool':
        return makeNode('Bool', node.locationData, {
          data: JSON.parse(node.val)
        });

      case 'Null':
        return makeNode('Null', node.locationData);

      case 'Undefined':
        return makeNode('Undefined', node.locationData);

      case 'Return':
        return makeNode('Return', node.locationData, {
          expression: node.expression ? convertChild(node.expression) : null
        });

      case 'For':
        if (locationsEqual(node.body.locationData, node.locationData)) {
          node.body.locationData = locationContainingNodes(...node.body.expressions);
        }
        if (node.object) {
          return makeNode('ForOf', node.locationData, {
            keyAssignee: convertChild(node.index),
            valAssignee: convertChild(node.name),
            body: convertChild(node.body),
            target: convertChild(node.source),
            filter: convertChild(node.guard),
            isOwn: node.own
          });
        } else {
          return makeNode('ForIn', node.locationData, {
            keyAssignee: convertChild(node.index),
            valAssignee: convertChild(node.name),
            body: convertChild(node.body),
            target: convertChild(node.source),
            filter: convertChild(node.guard),
            step: convertChild(node.step)
          });
        }

      case 'While':
        const result = makeNode('While', locationContainingNodes(node, node.condition, node.body), {
          condition: convertChild(node.condition),
          guard: convertChild(node.guard),
          body: convertChild(node.body),
          isUntil: node.condition.inverted === true
        });
        if (result.raw.indexOf('loop') === 0) {
          result.condition = {
            type: 'Bool',
            data: true,
            virtual: true
          };
        }
        return result;

      case 'Existence':
        return makeNode('UnaryExistsOp', node.locationData, {
          expression: convertChild(node.expression)
        });

      case 'Class':
        const nameNode = node.variable ? convertChild(node.variable) : null;

        let ctor = null;
        let boundMembers = [];
        const body = (!node.body || node.body.expressions.length === 0) ? null : makeNode('Block', node.body.locationData, {
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
                  statements.push(ctor = makeNode('Constructor', property.locationData, {
                    assignee: key,
                    expression: value
                  }));
                } else if (key.type === 'MemberAccessOp' && key.expression.type === 'This') {
                  statements.push(makeNode('AssignOp', property.locationData, {
                    assignee: key,
                    expression: value
                  }));
                } else {
                  statements.push(makeNode('ClassProtoAssignOp', property.locationData, {
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

        return makeNode('Class', node.locationData, {
          name: nameNode,
          nameAssignee: nameNode,
          body,
          boundMembers,
          parent: node.parent ? convertChild(node.parent) : null,
          ctor
        });

      case 'Switch':
        return makeNode('Switch', node.locationData, {
          expression: convertChild(node.subject),
          cases: node.cases.map(([conditions, body]) => {
            if (!Array.isArray(conditions)) {
              conditions = [conditions];
            }
            const loc = expandLocationLeftThrough(
              locationContainingNodes(conditions[0], body),
              'when '
            );
            return makeNode('SwitchCase', loc, {
              conditions: convertChild(conditions),
              consequent: convertChild(body)
            })
          }).filter(node => node),
          alternate: convertChild(node.otherwise)
        });

      case 'Splat':
        return makeNode('Spread', node.locationData, {
          expression: convertChild(node.name)
        });

      case 'Throw':
        return makeNode('Throw', node.locationData, {
          expression: convertChild(node.expression)
        });

      case 'Try':
        return makeNode('Try', node.locationData, {
          body: convertChild(node.attempt),
          catchAssignee: convertChild(node.errorVariable),
          catchBody: convertChild(node.recovery),
          finallyBody: convertChild(node.ensure)
        });

      case 'Range':
        return makeNode('Range', node.locationData, {
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
          if (token.type === RELATION) {
            isNot = source.slice(token.start, token.end) !== 'in';
          }
        }

        return makeNode('InOp', node.locationData, {
          left,
          right,
          isNot
        });
      }

      case 'Expansion':
        return makeNode('Expansion', node.locationData);

      case 'Comment':
        return null;

      case 'Extends':
        return makeNode('ExtendsOp', node.locationData, {
          left: convertChild(node.child),
          right: convertChild(node.parent)
        });

      default:
        throw new Error(`unknown node type: ${type(node)}\n${JSON.stringify(node, null, 2)}`);
        break;
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

    function makeNode(type, loc, attrs = {}) {
      const result = {type};
      if (loc) {
        const start = linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });
        const end = linesAndColumns.indexForLocation({ line: loc.last_line, column: loc.last_column }) + 1;
        result.line = loc.first_line + 1;
        result.column = loc.first_column + 1;
        result.range = [start, end];
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
        if (result.range[1] > source.length) {
          result.range[1] = source.length;
        }
        // Shrink the end to the nearest semantic token.
        let lastTokenIndexOfNode = context.sourceTokens.lastIndexOfTokenMatchingPredicate(token => {
          return (
            token.end <= result.range[1] &&
            token.type !== NEWLINE &&
            token.type !== COMMENT &&
            token.type !== HERECOMMENT
          );
        });

        let lastTokenOfNode = context.sourceTokens.tokenAtIndex(lastTokenIndexOfNode);
        result.range[1] = lastTokenOfNode.end;
        result.raw = source.slice(result.range[0], result.range[1]);
      }
      return result;
    }

    function createTemplateLiteral(op) {
      let tokens = context.sourceTokens;
      let startTokenIndex = tokens.indexOfTokenContainingSourceIndex(op.range[0]);
      let interpolatedStringTokenRange = tokens.rangeOfInterpolatedStringTokensContainingTokenIndex(startTokenIndex);
      if (!interpolatedStringTokenRange) {
        throw new Error('cannot find interpolation end for node');
      }
      let firstToken = tokens.tokenAtIndex(interpolatedStringTokenRange[0]);
      let lastToken = tokens.tokenAtIndex(interpolatedStringTokenRange[1].previous());
      op.type = 'String';
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

      function buildFirstQuasi() {
        // Find the start of the first interpolation, i.e. "#{a}".
        //                                                  ^
        let startOfInterpolation = op.range[0];
        while (source[startOfInterpolation] !== '#') {
          if (startOfInterpolation >= source.length) {
            throw new Error(
              `Unable to find start of interpolation for op ${JSON.stringify(op)}`);
          }
          startOfInterpolation += 1;
        }
        let range = [op.range[0], startOfInterpolation];
        return buildQuasi(range);
      }

      function buildLastQuasi() {
        // Find the close of the last interpolation, i.e. "a#{b}".
        //                                                     ^
        let endOfInterpolation = op.range[1] - 1;
        while (source[endOfInterpolation] !== '}') {
          if (endOfInterpolation < 0) {
            throw new Error(
              `Unable to find last interpolation for op ${JSON.stringify(op)}`);
          }
          endOfInterpolation -= 1;
        }
        return buildQuasi([endOfInterpolation + 1, op.range[1]]);
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
            let borderIndex = source.lastIndexOf('#{', element.range[0]);
            quasis.push(buildQuasi([borderIndex, borderIndex]));
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
          return makeNode(prop.soak ? 'SoakedMemberAccessOp' : 'MemberAccessOp', mergeLocations(loc, prop.locationData), {
            expression,
            memberName: prop.name.value
          });

        case 'Index':
          return makeNode(prop.soak ? 'SoakedDynamicMemberAccessOp' : 'DynamicMemberAccessOp', mergeLocations(loc, prop.locationData), {
            expression,
            indexingExpr: convertNode(prop.index, [...ancestors, node, prop])
          });

        case 'Slice':
          return makeNode('Slice', mergeLocations(loc, prop.locationData), {
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

        let result = makeNode(nodeType, op.locationData, {
          left: convertNode(op.first, [...ancestors, op]),
          right: convertNode(op.second, [...ancestors, op])
        });
        if (result.type === 'InstanceofOp' || result.type === 'OfOp') {
          let lastTokenIndexOfLeft = context.sourceTokens.indexOfTokenEndingAtSourceIndex(result.left.range[1]);
          let firstTokenIndexOfRight = context.sourceTokens.indexOfTokenStartingAtSourceIndex(result.right.range[0]);
          let isNot = false;

          for (let i = lastTokenIndexOfLeft.next(); i !== firstTokenIndexOfRight; i = i.next()) {
            let token = context.sourceTokens.tokenAtIndex(i);
            if (token.type === OPERATOR || token.type === RELATION) {
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
            return makeNode('NewOp', op.locationData, {
              ctor: convertChild(op.first),
              arguments: []
            });

          case 'yield':
            return makeNode('Yield', op.locationData, {
              expression: convertChild(op.first)
            });

          case 'yield*':
            return makeNode('YieldFrom', op.locationData, {
              expression: convertChild(op.first)
            });

          default:
            throw new Error(`unknown unary operator: ${op.operator}`);
        }

        return makeNode(nodeType, op.locationData, {
          expression: convertNode(op.first, [...ancestors, op])
        });
      }
    }

    function expandLocationLeftThrough(loc, string) {
      let offset = linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });
      offset = source.lastIndexOf(string, offset);

      if (offset < 0) {
        throw new Error(
          `unable to expand location starting at ${loc.first_line + 1}:${loc.first_column + 1} ` +
          `because it is not preceded by ${JSON.stringify(string)}`
        );
      }

      const newLoc = linesAndColumns.locationForIndex(offset);

      return {
        first_line: newLoc.line,
        first_column: newLoc.column,
        last_line: loc.last_line,
        last_column: loc.last_column
      };
    }
  }
}

function nodeTypeForLiteral(value) {
  switch (typeof value) {
    case 'number':
      return Math.floor(value) === value ? 'Int' : 'Float';

    default:
      throw new Error(`unimplemented node type for ${JSON.stringify(value)}`);
  }
}


