import { Arr, Base, Bool, Literal, Null, Return, Throw, Undefined } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { Node } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapArr from './mapArr';
import mapBool from './mapBool';
import mapLiteral from './mapLiteral';
import mapNull from './mapNull';
import mapReturn from './mapReturn';
import mapThrow from './mapThrow';
import mapUndefined from './mapUndefined';

export default function mapAny(context: ParseContext, node: Base): Node {
  if (node instanceof Arr) {
    return mapArr(context, node);
  } else if (node instanceof Bool) {
    return mapBool(context, node);
  } else if (node instanceof Literal) {
    return mapLiteral(context, node);
  } else if (node instanceof Return) {
    return mapReturn(context, node);
  } else if (node instanceof Null) {
    return mapNull(context, node);
  } else if (node instanceof Throw) {
    return mapThrow(context, node);
  } else if (node instanceof Undefined) {
    return mapUndefined(context, node);
  } else {
    throw new Error(`unhandled node type: ${node.constructor.name} (${inspect(node)})`);
  }
}
