import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import ParseContext from './util/ParseContext';

export interface RealNode {
  type: string;
  line: number;
  column: number;
  range: [number, number];
  raw: string;
}

export class Node {
  readonly range: [number, number];

  constructor(
    readonly type: string,
    readonly line: number,
    readonly column: number,
    readonly start: number,
    readonly end: number,
    readonly raw: string,
  ) {
    this.range = [start, end];
    this.raw = raw;
  }
}

export class Identifier extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly data: string,
  ) {
    super('Identifier', line, column, start, end, raw);
  }
}

export class Bool extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly data: boolean,
  ) {
    super('Bool', line, column, start, end, raw);
  }

  static true(): Bool {
    return new Bool(0, 0, 0, 0, '', true);
  }

  static false(): Bool {
    return new Bool(0, 0, 0, 0, '', false);
  }
}

export class JavaScript extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly data: string,
  ) {
    super('JavaScript', line, column, start, end, raw);
  }
}

export class Number extends Node {
  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly data: number,
  ) {
    super(type, line, column, start, end, raw);
  }
}

export class Float extends Number {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    data: number
  ) {
    super('Float', line, column, start, end, raw, data);
  }
}

export class Int extends Number {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    data: number
  ) {
    super('Int', line, column, start, end, raw, data);
  }
}

export abstract class AccessOp extends Node {
  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node,
  ) {
    super(type, line, column, start, end, raw);
  }
}

export class MemberAccessOp extends AccessOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
    readonly member: Identifier,
  ) {
    super('MemberAccessOp', line, column, start, end, raw, expression);
  }
}

export class ProtoMemberAccessOp extends AccessOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node
  ) {
    super('ProtoMemberAccessOp', line, column, start, end, raw, expression);
  }
}

export class SoakedMemberAccessOp extends AccessOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
    readonly member: Identifier,
  ) {
    super('SoakedMemberAccessOp', line, column, start, end, raw, expression);
  }
}

export class SoakedProtoMemberAccessOp extends AccessOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node
  ) {
    super('SoakedProtoMemberAccessOp', line, column, start, end, raw, expression);
  }
}

export class Quasi extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly data: string,
  ) {
    super('Quasi', line, column, start, end, raw);
  }
}

export class String extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly quasis: Array<Quasi>,
    readonly expressions: Array<Node>,
  ) {
    super('String', line, column, start, end, raw);
  }
}

export class ObjectInitialiser extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly members: Array<ObjectInitialiserMember>,
  ) {
    super('ObjectInitialiser', line, column, start, end, raw);
  }
}

export class ObjectInitialiserMember extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly key: String | Identifier,
    readonly expression: Node,
  ) {
    super('ObjectInitialiserMember', line, column, start, end, raw);
  }
}

export class Conditional extends Node {

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly condition: Node,
    readonly consequent: Block,
    readonly alternate: Block | null,
    readonly isUnless: boolean,
  ) {
    super('Conditional', line, column, start, end, raw);
  }
}

export class Program extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly body: Block,
  ) {
    super('Program', line, column, start, end, raw);
  }
}

export class Block extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly statements: Array<Node>,
    readonly inline: boolean,
  ) {
    super('Block', line, column, start, end, raw);
  }
}

export class Loop extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly body: Node | null,
  ) {
    super('Loop', line, column, start, end, raw);
  }
}

export class While extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly condition: Node,
    readonly guard: Node | null,
    readonly body: Node | null,
    readonly isUntil: boolean,
  ) {
    super('While', line, column, start, end, raw);
  }
}

export abstract class For extends Node {
  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly keyAssignee: Node | null,
    readonly valAssignee: Node | null,
    readonly target: Node,
    readonly filter: Node | null,
    readonly body: Block,
  ) {
    super(type, line, column, start, end, raw);
  }
}

export class ForOf extends For {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    keyAssignee: Node | null,
    valAssignee: Node | null,
    target: Node,
    filter: Node | null,
    body: Block,
    readonly isOwn: boolean,
  ) {
    super('ForOf', line, column, start, end, raw, keyAssignee, valAssignee, target, filter, body);
  }
}

export class ForIn extends For {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    keyAssignee: Node | null,
    valAssignee: Node | null,
    target: Node,
    filter: Node | null,
    body: Block,
    readonly step: Node | null,
  ) {
    super('ForIn', line, column, start, end, raw, keyAssignee, valAssignee, target, filter, body);
  }
}

export class Switch extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node | null,
    readonly cases: Array<SwitchCase>,
    readonly alternate: Block | null,
  ) {
    super('Switch', line, column, start, end, raw);
  }
}

export class SwitchCase extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly conditions: Array<Node>,
    readonly consequent: Block,
  ) {
    super('SwitchCase', line, column, start, end, raw);
  }
}

export class RegexFlags {
  readonly g: boolean;
  readonly i: boolean;
  readonly m: boolean;
  readonly y: boolean;

  constructor(
    readonly global: boolean,
    readonly ignoreCase: boolean,
    readonly multiline: boolean,
    readonly sticky: boolean,
  ) {
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
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly quasis: Array<Quasi>,
    readonly expressions: Array<Node>,
    readonly flags: RegexFlags,
  ) {
    super('Heregex', line, column, start, end, raw);
  }
}

export class Null extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
  ) {
    super('Null', line, column, start, end, raw);
  }
}

export class Undefined extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
  ) {
    super('Undefined', line, column, start, end, raw);
  }
}

export class Regex extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly pattern: string,
    readonly flags: RegexFlags,
  ) {
    super('Regex', line, column, start, end, raw);
  }
}

export class Return extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node | null,
  ) {
    super('Return', line, column, start, end, raw);
  }
}

export class YieldReturn extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node | null,
  ) {
    super('YieldReturn', line, column, start, end, raw);
  }
}

export class This extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
  ) {
    super('This', line, column, start, end, raw);
  }
}

export class Throw extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node | null,
  ) {
    super('Throw', line, column, start, end, raw);
  }
}

export class ArrayInitialiser extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly members: Array<Node>,
  ) {
    super('ArrayInitialiser', line, column, start, end, raw);
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
    param: Node,
    defaultValue: Node
  ) {
    super('DefaultParam', line, column, start, end, raw);
    this.param = param;
    this.default = defaultValue;
  }
}

export class Rest extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node,
  ) {
    super('Rest', line, column, start, end, raw);
  }
}

export class Break extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
  ) {
    super('Break', line, column, start, end, raw);
  }
}

export class Continue extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
  ) {
    super('Continue', line, column, start, end, raw);
  }
}

export class Spread extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node,
  ) {
    super('Spread', line, column, start, end, raw);
  }
}

export class Range extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly left: Node,
    readonly right: Node,
    readonly isInclusive: boolean,
  ) {
    super('Range', line, column, start, end, raw);
  }
}

export abstract class BinaryOp extends Node {
  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly left: Node,
    readonly right: Node,
  ) {
    super(type, line, column, start, end, raw);
  }
}

export abstract class UnaryOp extends Node {
  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node,
  ) {
    super(type, line, column, start, end, raw);
  }
}

export class ChainedComparisonOp extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly operands: Array<Node>,
    readonly operators: Array<OperatorInfo>,
  ) {
    super('ChainedComparisonOp', line, column, start, end, raw);
  }
}

export class OperatorInfo {
  constructor(
    readonly operator: string,
    readonly token: SourceToken,
  ) {
  }
}

export type Op = UnaryOp | BinaryOp | ChainedComparisonOp;

export class EQOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('EQOp', line, column, start, end, raw, left, right);
  }
}

export class NEQOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('NEQOp', line, column, start, end, raw, left, right);
  }
}

export class LTOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('LTOp', line, column, start, end, raw, left, right);
  }
}

export class LTEOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('LTEOp', line, column, start, end, raw, left, right);
  }
}

export class GTOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('GTOp', line, column, start, end, raw, left, right);
  }
}

export class GTEOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('GTEOp', line, column, start, end, raw, left, right);
  }
}

export class LogicalNotOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('LogicalNotOp', line, column, start, end, raw, expression);
  }
}

export class LogicalAndOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('LogicalAndOp', line, column, start, end, raw, left, right);
  }
}

export class LogicalOrOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('LogicalOrOp', line, column, start, end, raw, left, right);
  }
}

export class SubtractOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('SubtractOp', line, column, start, end, raw, left, right);
  }
}

export class PlusOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('PlusOp', line, column, start, end, raw, left, right);
  }
}

export class UnaryPlusOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node
  ) {
    super('UnaryPlusOp', line, column, start, end, raw, expression);
  }
}

export class MultiplyOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('MultiplyOp', line, column, start, end, raw, left, right);
  }
}

export class DivideOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('DivideOp', line, column, start, end, raw, left, right);
  }
}

export class UnaryExistsOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node
  ) {
    super('UnaryExistsOp', line, column, start, end, raw, expression);
  }
}

export class UnaryNegateOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('UnaryNegateOp', line, column, start, end, raw, expression);
  }
}

export class BitNotOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('BitNotOp', line, column, start, end, raw, expression);
  }
}

export class BitAndOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('BitAndOp', line, column, start, end, raw, left, right);
  }
}

export class BitOrOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('BitOrOp', line, column, start, end, raw, left, right);
  }
}

export class BitXorOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('BitXorOp', line, column, start, end, raw, left, right);
  }
}

export class LeftShiftOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('LeftShiftOp', line, column, start, end, raw, left, right);
  }
}

export class SignedRightShiftOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('SignedRightShiftOp', line, column, start, end, raw, left, right);
  }
}

export class UnsignedRightShiftOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('UnsignedRightShiftOp', line, column, start, end, raw, left, right);
  }
}

export class PreDecrementOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('PreDecrementOp', line, column, start, end, raw, expression);
  }
}

export class PreIncrementOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('PreIncrementOp', line, column, start, end, raw, expression);
  }
}

export class PostDecrementOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('PostDecrementOp', line, column, start, end, raw, expression);
  }
}

export class PostIncrementOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('PostIncrementOp', line, column, start, end, raw, expression);
  }
}

export class ExpOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('ExpOp', line, column, start, end, raw, left, right);
  }
}

export class RemOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('RemOp', line, column, start, end, raw, left, right);
  }
}

export class ModuloOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
  ) {
    super('ModuloOp', line, column, start, end, raw, left, right);
  }
}

export class InOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
    readonly isNot: boolean,
  ) {
    super('InOp', line, column, start, end, raw, left, right);
  }
}

export class BaseAssignOp extends Node {
  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly assignee: Node,
    readonly expression: Node,
  ) {
    super(type, line, column, start, end, raw);
  }
}

export class AssignOp extends BaseAssignOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    assignee: Node,
    expression: Node
  ) {
    super('AssignOp', line, column, start, end, raw, assignee, expression);
  }

  withExpression(expression: Node): AssignOp {
    return new AssignOp(
      this.line, this.column, this.start, this.end, this.raw, this.assignee, expression
    );
  }
}

export class ExtendsOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('ExtendsOp', line, column, start, end, raw, left, right);
  }
}

export class SeqOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node
  ) {
    super('SeqOp', line, column, start, end, raw, left, right);
  }
}

export class TypeofOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('TypeofOp', line, column, start, end, raw, expression);
  }
}

export class InstanceofOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
    readonly isNot: boolean,
  ) {
    super('InstanceofOp', line, column, start, end, raw, left, right);
  }
}

export class OfOp extends BinaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    left: Node,
    right: Node,
    readonly isNot: boolean,
  ) {
    super('OfOp', line, column, start, end, raw, left, right);
  }
}

export class DeleteOp extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('DeleteOp', line, column, start, end, raw, expression);
  }
}

export class Yield extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('Yield', line, column, start, end, raw, expression);
  }
}

export class YieldFrom extends UnaryOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    expression: Node,
  ) {
    super('YieldFrom', line, column, start, end, raw, expression);
  }
}

export class Slice extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node,
    readonly left: Node | null,
    readonly right: Node | null,
    readonly isInclusive: boolean,
  ) {
    super('Slice', line, column, start, end, raw);
  }
}

export abstract class BaseFunction extends Node {
  constructor(
    type: string,
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly parameters: Array<Node>,
    readonly body: Block,
  ) {
    super(type, line, column, start, end, raw);
  }

  abstract withParameters(parameters: Array<Node>): BaseFunction;
}

export class Function extends BaseFunction {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    parameters: Array<Node>,
    body: Block
  ) {
    super('Function', line, column, start, end, raw, parameters, body);
  }

  withParameters(parameters: Array<Node>): BaseFunction {
    return new Function(
      this.line, this.column, this.start, this.end, this.raw, parameters, this.body
    );
  }
}

export class BoundFunction extends BaseFunction {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    parameters: Array<Node>,
    body: Block
  ) {
    super('BoundFunction', line, column, start, end, raw, parameters, body);
  }

  withParameters(parameters: Array<Node>): BaseFunction {
    return new BoundFunction(
      this.line, this.column, this.start, this.end, this.raw, parameters, this.body
    );
  }
}

export class GeneratorFunction extends BaseFunction {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    parameters: Array<Node>,
    body: Block
  ) {
    super('GeneratorFunction', line, column, start, end, raw, parameters, body);
  }

  withParameters(parameters: Array<Node>): BaseFunction {
    return new GeneratorFunction(
      this.line, this.column, this.start, this.end, this.raw, parameters, this.body
    );
  }
}

export class BoundGeneratorFunction extends BaseFunction {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    parameters: Array<Node>,
    body: Block
  ) {
    super('BoundGeneratorFunction', line, column, start, end, raw, parameters, body);
  }

  withParameters(parameters: Array<Node>): BaseFunction {
    return new BoundGeneratorFunction(
      this.line, this.column, this.start, this.end, this.raw, parameters, this.body
    );
  }
}

export class Try extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly body: Node | null,
    readonly catchAssignee: Node | null,
    readonly catchBody: Node | null,
    readonly finallyBody: Node | null,
  ) {
    super('Try', line, column, start, end, raw);
  }
}

export class Constructor extends BaseAssignOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    assignee: Node,
    expression: Node
  ) {
    super('Constructor', line, column, start, end, raw, assignee, expression);
  }
}

export class ClassProtoAssignOp extends BaseAssignOp {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    assignee: Node,
    expression: Node
  ) {
    super('ClassProtoAssignOp', line, column, start, end, raw, assignee, expression);
  }
}

export class Class extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly nameAssignee: Node | null,
    readonly name: Node | null,
    readonly body: Block | null,
    readonly boundMembers: Array<ClassProtoAssignOp>,
    readonly parent: Node | null,
    readonly ctor: Constructor | null,
  ) {
    super('Class', line, column, start, end, raw);
  }
}

export class FunctionApplication extends Node {
  readonly function: Node;
  readonly arguments: Array<Node>;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    fn: Node,
    args: Array<Node>
  ) {
    super('FunctionApplication', line, column, start, end, raw);
    this.function = fn;
    this.arguments = args;
  }
}

export class SoakedFunctionApplication extends Node {
  readonly function: Node;
  readonly arguments: Array<Node>;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    fn: Node,
    args: Array<Node>
  ) {
    super('SoakedFunctionApplication', line, column, start, end, raw);
    this.function = fn;
    this.arguments = args;
  }
}

export class Super extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
  ) {
    super('Super', line, column, start, end, raw);
  }
}

export class BareSuperFunctionApplication extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
  ) {
    super('BareSuperFunctionApplication', line, column, start, end, raw);
  }
}

export class NewOp extends Node {
  readonly ctor: Node;
  readonly arguments: Array<Node>;

  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    ctor: Node,
    args: Array<Node>
  ) {
    super('NewOp', line, column, start, end, raw);
    this.ctor = ctor;
    this.arguments = args;
  }
}

export class DoOp extends Node {
  constructor(
    line: number,
    column: number,
    start: number,
    end: number,
    raw: string,
    readonly expression: Node
  ) {
    super('DoOp', line, column, start, end, raw);
  }
}

// tslint:disable-next-line:no-any
export function makeRealNode(context: ParseContext, type: string, loc: LocationData, attrs: any = {}): Node {
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
      token.type !== SourceType.COMMENT
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
export default function makeNode(context: ParseContext, type: string, loc: LocationData, attrs: any = {}): Node {
  if (!loc) {
    throw new Error(`location data must be provided for node type: ${type}`);
  }

  return makeRealNode(context, type, loc, attrs);
}
