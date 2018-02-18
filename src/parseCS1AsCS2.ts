import {nodes} from 'decaffeinate-coffeescript';
import {
  Access as CS1Access,
  Arr as CS1Arr,
  Assign as CS1Assign,
  Base as CS1Base,
  Block as CS1Block,
  BooleanLiteral as CS1BooleanLiteral,
  Call as CS1Call,
  Class as CS1Class,
  Code as CS1Code,
  Comment as CS1Comment,
  Existence as CS1Existence,
  Expansion as CS1Expansion,
  ExportAllDeclaration as CS1ExportAllDeclaration,
  ExportDeclaration as CS1ExportDeclaration,
  ExportDefaultDeclaration as CS1ExportDefaultDeclaration,
  ExportNamedDeclaration as CS1ExportNamedDeclaration,
  ExportSpecifier as CS1ExportSpecifier,
  ExportSpecifierList as CS1ExportSpecifierList,
  Extends as CS1Extends,
  For as CS1For,
  IdentifierLiteral as CS1IdentifierLiteral,
  If as CS1If,
  ImportClause as CS1ImportClause,
  ImportDeclaration as CS1ImportDeclaration,
  ImportDefaultSpecifier as CS1ImportDefaultSpecifier,
  ImportNamespaceSpecifier as CS1ImportNamespaceSpecifier,
  ImportSpecifier as CS1ImportSpecifier,
  ImportSpecifierList as CS1ImportSpecifierList,
  In as CS1In,
  Index as CS1Index,
  InfinityLiteral as CS1InfinityLiteral,
  Literal as CS1Literal,
  ModuleDeclaration as CS1ModuleDeclaration,
  ModuleSpecifier as CS1ModuleSpecifier,
  ModuleSpecifierList as CS1ModuleSpecifierList,
  NaNLiteral as CS1NaNLiteral,
  NullLiteral as CS1NullLiteral,
  NumberLiteral as CS1NumberLiteral,
  Obj as CS1Obj,
  Op as CS1Op,
  Param as CS1Param,
  Parens as CS1Parens,
  PassthroughLiteral as CS1PassthroughLiteral,
  PropertyName as CS1PropertyName,
  Range as CS1Range,
  RegexLiteral as CS1RegexLiteral,
  RegexWithInterpolations as CS1RegexWithInterpolations,
  Return as CS1Return,
  Slice as CS1Slice,
  Splat as CS1Splat,
  StatementLiteral as CS1StatementLiteral,
  StringLiteral as CS1StringLiteral,
  StringWithInterpolations as CS1StringWithInterpolations,
  SuperCall as CS1SuperCall,
  Switch as CS1Switch,
  SwitchCaseCondition as CS1SwitchCaseCondition,
  TaggedTemplateCall as CS1TaggedTemplateCall,
  ThisLiteral as CS1ThisLiteral,
  Throw as CS1Throw,
  Try as CS1Try,
  UndefinedLiteral as CS1UndefinedLiteral,
  Value as CS1Value,
  While as CS1While,
  YieldReturn as CS1YieldReturn,
} from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import {
  Access,
  Arr,
  Assign,
  Base,
  Block,
  BooleanLiteral,
  Call,
  Class,
  Code,
  Existence,
  Expansion,
  ExportAllDeclaration,
  ExportDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  ExportSpecifierList,
  Extends,
  For,
  IdentifierLiteral,
  If,
  ImportClause,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  ImportSpecifierList,
  In,
  Index,
  InfinityLiteral,
  Literal,
  ModuleDeclaration,
  ModuleSpecifier,
  ModuleSpecifierList,
  NaNLiteral,
  NullLiteral,
  NumberLiteral,
  Obj,
  Op,
  Param,
  Parens,
  PassthroughLiteral,
  PropertyName,
  Range,
  RegexLiteral,
  RegexWithInterpolations,
  Return,
  Slice,
  Splat,
  StatementLiteral,
  StringLiteral,
  StringWithInterpolations,
  SuperCall,
  Switch,
  TaggedTemplateCall,
  ThisLiteral,
  Throw,
  Try,
  UndefinedLiteral,
  Value,
  While,
  YieldReturn,
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';

const nodeTypeMap = new Map();
nodeTypeMap.set(CS1Base, Base);
nodeTypeMap.set(CS1Block, Block);
nodeTypeMap.set(CS1Literal, Literal);
nodeTypeMap.set(CS1NumberLiteral, NumberLiteral);
nodeTypeMap.set(CS1InfinityLiteral, InfinityLiteral);
nodeTypeMap.set(CS1NaNLiteral, NaNLiteral);
nodeTypeMap.set(CS1StringLiteral, StringLiteral);
nodeTypeMap.set(CS1RegexLiteral, RegexLiteral);
nodeTypeMap.set(CS1PassthroughLiteral, PassthroughLiteral);
nodeTypeMap.set(CS1IdentifierLiteral, IdentifierLiteral);
nodeTypeMap.set(CS1PropertyName, PropertyName);
nodeTypeMap.set(CS1StatementLiteral, StatementLiteral);
nodeTypeMap.set(CS1ThisLiteral, ThisLiteral);
nodeTypeMap.set(CS1UndefinedLiteral, UndefinedLiteral);
nodeTypeMap.set(CS1NullLiteral, NullLiteral);
nodeTypeMap.set(CS1BooleanLiteral, BooleanLiteral);
nodeTypeMap.set(CS1Return, Return);
nodeTypeMap.set(CS1YieldReturn, YieldReturn);
nodeTypeMap.set(CS1Value, Value);
nodeTypeMap.set(CS1Call, Call);
nodeTypeMap.set(CS1SuperCall, SuperCall);
nodeTypeMap.set(CS1RegexWithInterpolations, RegexWithInterpolations);
nodeTypeMap.set(CS1TaggedTemplateCall, TaggedTemplateCall);
nodeTypeMap.set(CS1Extends, Extends);
nodeTypeMap.set(CS1Access, Access);
nodeTypeMap.set(CS1Index, Index);
nodeTypeMap.set(CS1Range, Range);
nodeTypeMap.set(CS1Slice, Slice);
nodeTypeMap.set(CS1Obj, Obj);
nodeTypeMap.set(CS1Arr, Arr);
nodeTypeMap.set(CS1Class, Class);
nodeTypeMap.set(CS1ModuleDeclaration, ModuleDeclaration);
nodeTypeMap.set(CS1ImportDeclaration, ImportDeclaration);
nodeTypeMap.set(CS1ImportClause, ImportClause);
nodeTypeMap.set(CS1ExportDeclaration, ExportDeclaration);
nodeTypeMap.set(CS1ExportNamedDeclaration, ExportNamedDeclaration);
nodeTypeMap.set(CS1ExportDefaultDeclaration, ExportDefaultDeclaration);
nodeTypeMap.set(CS1ExportAllDeclaration, ExportAllDeclaration);
nodeTypeMap.set(CS1ModuleSpecifierList, ModuleSpecifierList);
nodeTypeMap.set(CS1ImportSpecifierList, ImportSpecifierList);
nodeTypeMap.set(CS1ExportSpecifierList, ExportSpecifierList);
nodeTypeMap.set(CS1ModuleSpecifier, ModuleSpecifier);
nodeTypeMap.set(CS1ImportSpecifier, ImportSpecifier);
nodeTypeMap.set(CS1ImportDefaultSpecifier, ImportDefaultSpecifier);
nodeTypeMap.set(CS1ImportNamespaceSpecifier, ImportNamespaceSpecifier);
nodeTypeMap.set(CS1ExportSpecifier, ExportSpecifier);
nodeTypeMap.set(CS1Assign, Assign);
nodeTypeMap.set(CS1Code, Code);
nodeTypeMap.set(CS1Param, Param);
nodeTypeMap.set(CS1Splat, Splat);
nodeTypeMap.set(CS1Expansion, Expansion);
nodeTypeMap.set(CS1While, While);
nodeTypeMap.set(CS1Op, Op);
nodeTypeMap.set(CS1In, In);
nodeTypeMap.set(CS1Try, Try);
nodeTypeMap.set(CS1Throw, Throw);
nodeTypeMap.set(CS1Existence, Existence);
nodeTypeMap.set(CS1Parens, Parens);
nodeTypeMap.set(CS1StringWithInterpolations, StringWithInterpolations);
nodeTypeMap.set(CS1For, For);
nodeTypeMap.set(CS1Switch, Switch);
nodeTypeMap.set(CS1If, If);

/**
 * Run the CS1 parser and convert the resulting AST into a CS2-compatible AST.
 */
export default function parseCS1AsCS2(source: string): Block {
  let cs1AST = nodes(source);
  let cs2AST = convertCS1NodeToCS2(cs1AST);
  if (!(cs2AST instanceof Block)) {
    throw new Error('Expected top-level CS file to convert to a Block');
  }
  return cs2AST;
}

function convertCS1NodeToCS2(node: CS1Base): Base {
  if (node instanceof CS1Comment) {
    return makeCS2Comment(node);
  }
  let cs1Constructor = node.constructor;
  let cs2Constructor = nodeTypeMap.get(cs1Constructor);
  if (!cs2Constructor) {
    throw new Error(`Unexpected CS1 type for node ${node}`);
  }
  let result = Object.create(cs2Constructor.prototype);
  for (let key of Object.keys(node)) {
    let value = node[key];
    if (Array.isArray(value) && value.length > 0 && value[0] instanceof CS1Base) {
      result[key] = value
        .map((child: CS1Base) => convertCS1NodeToCS2(child));
    } else if (key === 'cases') {
      // Switch cases have a complex structure, so special-case those.
      result[key] = value.map(([switchCaseCondition, block]: [CS1SwitchCaseCondition, CS1Block]) => {
        if (Array.isArray(switchCaseCondition)) {
          return [
            switchCaseCondition.map((condition) => convertCS1NodeToCS2(condition)),
            convertCS1NodeToCS2(block)
          ];
        } else {
          return [convertCS1NodeToCS2(switchCaseCondition), convertCS1NodeToCS2(block)];
        }
      });
    } else if (value instanceof CS1Base) {
      result[key] = convertCS1NodeToCS2(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * The CS2 comment format is an empty passthrough node with comments attached. We need to keep
 * these nodes from CS1 in some cases so that we properly determine the end of functions ending
 * in block comments.
 */
function makeCS2Comment(comment: CS1Comment): Value {
  let valueNode = Object.create(Value.prototype);
  let passthroughNode = Object.create(PassthroughLiteral.prototype);
  valueNode.properties = [];
  valueNode.base = passthroughNode;
  passthroughNode.value = '';
  valueNode.locationData = comment.locationData;
  passthroughNode.locationData = comment.locationData;
  return valueNode;
}
