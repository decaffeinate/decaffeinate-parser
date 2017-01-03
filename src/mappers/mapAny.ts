import { Arr, Base, Bool, Existence, Literal, Null, Param, Return, Throw, Undefined, Value } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Node } from '../nodes';
import ParseContext from '../util/ParseContext';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapArr from './mapArr';
import mapBool from './mapBool';
import mapExistence from './mapExistence';
import mapLiteral from './mapLiteral';
import mapNull from './mapNull';
import mapParam from './mapParam';
import mapReturn from './mapReturn';
import mapThrow from './mapThrow';
import mapUndefined from './mapUndefined';
import mapValue from './mapValue';

export default function mapAny(context: ParseContext, node: Base): Node {
  if (node instanceof Value) {
    return mapValue(context, node);
  }

  if (node instanceof Literal) {
    return mapLiteral(context, node);
  }

  if (node instanceof Arr) {
    return mapArr(context, node);
  }

  if (node instanceof Bool) {
    return mapBool(context, node);
  }

  if (node instanceof Param) {
    return mapParam(context, node);
  }

  if (node instanceof Return) {
    return mapReturn(context, node);
  }

  if (node instanceof Null) {
    return mapNull(context, node);
  }

  if (node instanceof Throw) {
    return mapThrow(context, node);
  }

  if (node instanceof Undefined) {
    return mapUndefined(context, node);
  }

  if (node instanceof Existence) {
    return mapExistence(context, node);
  }

  throw new UnsupportedNodeError(node);
}
