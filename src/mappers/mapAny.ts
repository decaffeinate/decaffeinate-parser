import {
  Arr, Assign, Base, Block, Bool, Call, Class, Code, Existence, Extends, For, If, In, Literal, Null, Obj, Op,
  Param, Parens, Range, Return, Splat, Switch, Throw, Try, Undefined, Value, While
} from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Node } from '../nodes';
import ParseContext from '../util/ParseContext';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapArr from './mapArr';
import mapAssign from './mapAssign';
import mapBlock from './mapBlock';
import mapBool from './mapBool';
import mapCall from './mapCall';
import mapClass from './mapClass';
import mapCode from './mapCode';
import mapExistence from './mapExistence';
import mapExtends from './mapExtends';
import mapFor from './mapFor';
import mapIf from './mapIf';
import mapIn from './mapIn';
import mapLiteral from './mapLiteral';
import mapNull from './mapNull';
import mapObj from './mapObj';
import mapOp from './mapOp';
import mapParam from './mapParam';
import mapParens from './mapParens';
import mapRange from './mapRange';
import mapReturn from './mapReturn';
import mapSplat from './mapSplat';
import mapSwitch from './mapSwitch';
import mapThrow from './mapThrow';
import mapTry from './mapTry';
import mapUndefined from './mapUndefined';
import mapValue from './mapValue';
import mapWhile from './mapWhile';

export default function mapAny(context: ParseContext, node: Base): Node {
  if (node instanceof Value) {
    return mapValue(context, node);
  }

  if (node instanceof Literal) {
    return mapLiteral(context, node);
  }

  if (node instanceof Op) {
    return mapOp(context, node);
  }

  if (node instanceof Call) {
    return mapCall(context, node);
  }

  if (node instanceof Arr) {
    return mapArr(context, node);
  }

  if (node instanceof Bool) {
    return mapBool(context, node);
  }

  if (node instanceof Assign) {
    return mapAssign(context, node);
  }

  if (node instanceof Param) {
    return mapParam(context, node);
  }

  if (node instanceof Return) {
    return mapReturn(context, node);
  }

  if (node instanceof If) {
    return mapIf(context, node);
  }

  if (node instanceof Null) {
    return mapNull(context, node);
  }

  if (node instanceof Obj) {
    return mapObj(context, node);
  }

  if (node instanceof Parens) {
    return mapParens(context, node);
  }

  if (node instanceof For) {
    return mapFor(context, node);
  }

  if (node instanceof Throw) {
    return mapThrow(context, node);
  }

  if (node instanceof Undefined) {
    return mapUndefined(context, node);
  }

  if (node instanceof Block) {
    return mapBlock(context, node);
  }

  if (node instanceof Code) {
    return mapCode(context, node);
  }

  if (node instanceof While && !(node instanceof For)) {
    return mapWhile(context, node);
  }

  if (node instanceof Try) {
    return mapTry(context, node);
  }

  if (node instanceof Existence) {
    return mapExistence(context, node);
  }

  if (node instanceof Class) {
    return mapClass(context, node);
  }

  if (node instanceof Splat) {
    return mapSplat(context, node);
  }

  if (node instanceof Switch) {
    return mapSwitch(context, node);
  }

  if (node instanceof In) {
    return mapIn(context, node);
  }

  if (node instanceof Range) {
    return mapRange(context, node);
  }

  if (node instanceof Extends) {
    return mapExtends(context, node);
  }

  throw new UnsupportedNodeError(node);
}
