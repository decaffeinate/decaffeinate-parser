import { SourceType } from 'coffee-lex';
import { LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import ParseContext from './util/ParseContext';

export interface RealNode {
  type: string;
  line: number;
  column: number;
  range: [number, number];
  raw: string;
  virtual: false;
}

export interface VirtualNode {
  type: string;
  virtual: true;
}

export class Node {
  readonly type: string;
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly end: number;
  readonly range: [number, number];
  readonly raw: string;
  readonly virtual: boolean;

  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean
  ) {
    this.type = type;
    this.line = line;
    this.column = column;
    this.start = start;
    this.end = end;
    this.range = [start, end];
    this.raw = raw;
    this.virtual = virtual;
  }
}

export class Identifier extends Node {
  readonly data: string;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    data: string
  ) {
    super('Identifier', line, column, start, end, raw, virtual);
    this.data = data;
  }
}

export class Bool extends Node {
  readonly data: boolean;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    data: boolean
  ) {
    super('Bool', line, column, start, end, raw, virtual);
    this.data = data;
  }

  static true(): Bool {
    return new Bool(0, 0, 0, 0, '', true, true);
  }

  static false(): Bool {
    return new Bool(0, 0, 0, 0, '', true, false);
  }
}

export class JavaScript extends Node {
  readonly data: string;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    data: string
  ) {
    super('JavaScript', line, column, start, end, raw, virtual);
    this.data = data;
  }
}

export class Number extends Node {
  readonly data: number;

  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    data: number
  ) {
    super(type, line, column, start, end, raw, virtual);
    this.data = data;
  }
}

export class Float extends Number {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    data: number
  ) {
    super('Float', line, column, start, end, raw, virtual, data);
  }
}

export class Int extends Number {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    data: number
  ) {
    super('Int', line, column, start, end, raw, virtual, data);
  }
}

export abstract class AccessOp extends Node {
  readonly expression: Node;

  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node
  ) {
    super(type, line, column, start, end, raw, virtual);
    this.expression = expression;
  }
}

export class MemberAccessOp extends AccessOp {
  readonly member: Identifier;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node,
    member: Identifier
  ) {
    super('MemberAccessOp', line, column, start, end, raw, virtual, expression);
    this.member = member;
  }
}

export class ProtoMemberAccessOp extends AccessOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node
  ) {
    super('ProtoMemberAccessOp', line, column, start, end, raw, virtual, expression);
  }
}

export class Quasi extends Node {
  readonly data: string;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    data: string
  ) {
    super('Quasi', line, column, start, end, raw, virtual);
    this.data = data;
  }
}

export class String extends Node {
  readonly quasis: Array<Quasi>;
  readonly expressions: Array<Node>;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    quasis: Array<Quasi>,
    expressions: Array<Node>
  ) {
    super('String', line, column, start, end, raw, virtual);
    this.quasis = quasis;
    this.expressions = expressions;
  }
}

export class ObjectInitialiser extends Node {
  readonly members: Array<ObjectInitialiserMember>;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    members: Array<ObjectInitialiserMember>
  ) {
    super('ObjectInitialiser', line, column, start, end, raw, virtual);
    this.members = members;
  }
}

export class ObjectInitialiserMember extends Node {
  readonly key: String | Identifier;
  readonly expression: Node;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    key: String | Identifier,
    expression: Node
  ) {
    super('ObjectInitialiserMember', line, column, start, end, raw, virtual);
    this.key = key;
    this.expression = expression;
  }
}

export class Conditional extends Node {
  readonly condition: Node;
  readonly consequent: Block;
  readonly alternate: Block | null;
  readonly isUnless: boolean;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    condition: Node,
    consequent: Block,
    alternate: Block | null,
    isUnless: boolean
  ) {
    super('Conditional', line, column, start, end, raw, virtual);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
    this.isUnless = isUnless;
  }
}

export class Block extends Node {
  readonly statements: Array<Node>;
  readonly inline: boolean;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    statements: Array<Node>,
    inline: boolean
  ) {
    super('Block', line, column, start, end, raw, virtual);
    this.statements = statements;
    this.inline = inline;
  }
}

export class Loop extends Node {
  readonly body: Node | null;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    body: Node | null
  ) {
    super('Loop', line, column, start, end, raw, virtual);
    this.body = body;
  }
}

export class While extends Node {
  readonly condition: Node;
  readonly guard: Node | null;
  readonly body: Node | null;
  readonly isUntil: boolean;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    condition: Node,
    guard: Node | null,
    body: Node | null,
    isUntil: boolean
  ) {
    super('While', line, column, start, end, raw, virtual);
    this.condition = condition;
    this.guard = guard;
    this.body = body;
    this.isUntil = isUntil;
  }
}

export abstract class For extends Node {
  readonly keyAssignee: Node | null;
  readonly valAssignee: Node | null;
  readonly body: Block;
  readonly target: Node;
  readonly filter: Node | null;

  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    keyAssignee: Node | null,
    valAssignee: Node | null,
    target: Node,
    filter: Node | null,
    body: Block
  ) {
    super(type, line, column, start, end, raw, virtual);
    this.keyAssignee = keyAssignee;
    this.valAssignee = valAssignee;
    this.target = target;
    this.filter = filter;
    this.body = body;
  }
}

export class ForOf extends For {
  readonly isOwn: boolean;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    keyAssignee: Node | null,
    valAssignee: Node | null,
    target: Node,
    filter: Node | null,
    body: Block,
    isOwn: boolean,
  ) {
    super('ForOf', line, column, start, end, raw, virtual, keyAssignee, valAssignee, target, filter, body);
    this.isOwn = isOwn;
  }
}

export class ForIn extends For {
  readonly step: Node | null;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    keyAssignee: Node | null,
    valAssignee: Node | null,
    target: Node,
    filter: Node | null,
    body: Block,
    step: Node | null
  ) {
    super('ForIn', line, column, start, end, raw, virtual, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
  }
}

export class Switch extends Node {
  readonly expression: Node | null;
  readonly cases: Array<SwitchCase>;
  readonly alternate: Block | null;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node | null,
    cases: Array<SwitchCase>,
    alternate: Block | null
  ) {
    super('Switch', line, column, start, end, raw, virtual);
    this.expression = expression;
    this.cases = cases;
    this.alternate = alternate;
  }
}

export class SwitchCase extends Node {
  readonly conditions: Array<Node>;
  readonly consequent: Block;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    conditions: Array<Node>,
    consequent: Block
  ) {
    super('SwitchCase', line, column, start, end, raw, virtual);
    this.conditions = conditions;
    this.consequent = consequent;
  }
}

export class RegexFlags {
  readonly global: boolean;
  readonly ignoreCase: boolean;
  readonly multiline: boolean;
  readonly sticky: boolean;

  readonly g: boolean;
  readonly i: boolean;
  readonly m: boolean;
  readonly y: boolean;

  constructor(global: boolean, ignoreCase: boolean, multiline: boolean, sticky: boolean) {
    this.global = global;
    this.ignoreCase = ignoreCase;
    this.multiline = multiline;
    this.sticky = sticky;

    this.g = global;
    this.i = ignoreCase;
    this.m = multiline;
    this.y = sticky;
  }

  static parse(flags: string): RegexFlags {
    let global = false;
    let ignoreCase = false;
    let multiline = false;
    let sticky = false;

    for (let i = 0; i < flags.length; i++) {
      switch (flags.charCodeAt(i)) {
        case 103:
          global = true;
          break;

        case 105:
          ignoreCase = true;
          break;

        case 109:
          multiline = true;
          break;

        case 121:
          sticky = true;
          break;

        default:
          throw new Error(`invalid regular expression flags: ${flags}`);
      }
    }

    return new RegexFlags(global, ignoreCase, multiline, sticky);
  }
}

export class Heregex extends Node {
  readonly quasis: Array<Quasi>;
  readonly expressions: Array<Node>;
  readonly flags: RegexFlags;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    quasis: Array<Quasi>,
    expressions: Array<Node>,
    flags: RegexFlags
  ) {
    super('Heregex', line, column, start, end, raw, virtual);
    this.quasis = quasis;
    this.expressions = expressions;
    this.flags = flags;
  }
}

export class Null extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean
  ) {
    super('Null', line, column, start, end, raw, virtual);
  }
}

export class Undefined extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean
  ) {
    super('Undefined', line, column, start, end, raw, virtual);
  }
}

export class Regex extends Node {
  readonly pattern: string;
  readonly flags: RegexFlags;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    pattern: string,
    flags: RegexFlags
  ) {
    super('Regex', line, column, start, end, raw, virtual);
    this.pattern = pattern;
    this.flags = flags;
  }
}

export class Return extends Node {
  readonly expression: Node | null;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node | null
  ) {
    super('Return', line, column, start, end, raw, virtual);
    this.expression = expression;
  }
}

export class This extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean
  ) {
    super('This', line, column, start, end, raw, virtual);
  }
}

export class Throw extends Node {
  readonly expression: Node | null;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node | null
  ) {
    super('Throw', line, column, start, end, raw, virtual);
    this.expression = expression;
  }
}

export class ArrayInitialiser extends Node {
  readonly members: Array<Node>;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    members: Array<Node>
  ) {
    super('ArrayInitialiser', line, column, start, end, raw, virtual);
    this.members = members;
  }
}

export class DefaultParam extends Node {
  readonly param: Node;
  readonly default: Node;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    param: Node,
    defaultValue: Node
  ) {
    super('DefaultParam', line, column, start, end, raw, virtual);
    this.param = param;
    this.default = defaultValue;
  }
}

export class Rest extends Node {
  readonly expression: Node;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node
  ) {
    super('Rest', line, column, start, end, raw, virtual);
    this.expression = expression;
  }
}

export class Break extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean
  ) {
    super('Break', line, column, start, end, raw, virtual);
  }
}

export class Continue extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean
  ) {
    super('Continue', line, column, start, end, raw, virtual);
  }
}

export class UnaryExistsOp extends Node {
  readonly expression: Node;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node
  ) {
    super('UnaryExistsOp', line, column, start, end, raw, virtual);
    this.expression = expression;
  }
}

export class Spread extends Node {
  readonly expression: Node;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    expression: Node
  ) {
    super('Spread', line, column, start, end, raw, virtual);
    this.expression = expression;
  }
}

export class Range extends Node {
  readonly left: Node;
  readonly right: Node;
  readonly isInclusive: boolean;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    left: Node,
    right: Node,
    isInclusive: boolean
  ) {
    super('Range', line, column, start, end, raw, virtual);
    this.left = left;
    this.right = right;
    this.isInclusive = isInclusive;
  }
}

export class BinaryOp extends Node {
  readonly left: Node;
  readonly right: Node;

  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    left: Node,
    right: Node
  ) {
    super(type, line, column, start, end, raw, virtual);
    this.left = left;
    this.right = right;
  }
}

export class InOp extends BinaryOp {
  readonly isNot: boolean;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    left: Node,
    right: Node,
    isNot: boolean
  ) {
    super('InOp', line, column, start, end, raw, virtual, left, right);
    this.isNot = isNot;
  }
}

export class AssignOp extends Node {
  readonly assignee: Node;
  readonly expression: Node;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    assignee: Node,
    expression: Node
  ) {
    super('AssignOp', line, column, start, end, raw, virtual);
    this.assignee = assignee;
    this.expression = expression;
  }
}

export class ExtendsOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    left: Node,
    right: Node
  ) {
    super('ExtendsOp', line, column, start, end, raw, virtual, left, right);
  }
}

export class SeqOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    left: Node,
    right: Node
  ) {
    super('SeqOp', line, column, start, end, raw, virtual, left, right);
  }
}

abstract class BaseFunction extends Node {
  readonly parameters: Array<Node>;
  readonly body: Block;

  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    parameters: Array<Node>,
    body: Block
  ) {
    super(type, line, column, start, end, raw, virtual);
    this.parameters = parameters;
    this.body = body;
  }
}

export { BaseFunction };

export class Function extends BaseFunction {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    parameters: Array<Node>,
    body: Block
  ) {
    super('Function', line, column, start, end, raw, virtual, parameters, body);
  }
}

export class BoundFunction extends BaseFunction {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    parameters: Array<Node>,
    body: Block
  ) {
    super('BoundFunction', line, column, start, end, raw, virtual, parameters, body);
  }
}

export class GeneratorFunction extends BaseFunction {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    parameters: Array<Node>,
    body: Block
  ) {
    super('GeneratorFunction', line, column, start, end, raw, virtual, parameters, body);
  }
}

export class BoundGeneratorFunction extends BaseFunction {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    parameters: Array<Node>,
    body: Block
  ) {
    super('BoundGeneratorFunction', line, column, start, end, raw, virtual, parameters, body);
  }
}

export class Try extends Node {
  readonly body: Node | null;
  readonly catchAssignee: Node | null;
  readonly catchBody: Node | null;
  readonly finallyBody: Node | null;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    virtual: boolean,
    body: Node | null,
    catchAssignee: Node | null,
    catchBody: Node | null,
    finallyBody: Node | null
  ) {
    super('Try', line, column, start, end, raw, virtual);
    this.body = body;
    this.catchAssignee = catchAssignee;
    this.catchBody = catchBody;
    this.finallyBody = finallyBody;
  }
}

export type DecaffeinateNode =
  Bool |
  Null |
  RealNode |
  VirtualNode;

// tslint:disable-next-line:no-any
export function makeRealNode(context: ParseContext, type: string, loc: LocationData, attrs: any = {}): RealNode {
  // tslint:disable-next-line:no-any
  let result: any = { type };
  let start = context.linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });
  let last = context.linesAndColumns.indexForLocation({ line: loc.last_line, column: loc.last_column });

  if (start === null || last === null) {
    throw new Error(`unable to determine range for location: ${inspect(loc)}}`);
  }

  result.line = loc.first_line + 1;
  result.column = loc.first_column + 1;
  result.range = [start, last + 1];

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

  return result;
}

// tslint:disable-next-line:no-any
export function makeVirtualNode(type: string, attrs: any = {}): VirtualNode {
  // tslint:disable-next-line:no-any
  let result: any = {
    type,
    virtual: true
  };

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

  return result;
}

// tslint:disable-next-line:no-any
export default function makeNode(context: ParseContext, type: string, loc: LocationData, attrs: any = {}): DecaffeinateNode {
  if (loc) {
    return makeRealNode(context, type, loc, attrs);
  } else {
    return makeVirtualNode(type, attrs);
  }
}
