import { Param } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { DefaultParam, Node, Rest } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapParam(context: ParseContext, node: Param): Node {
  const { line, column, start, end, raw } = getLocation(context, node);
  const param = mapAny(context, node.name);

  if (node.value) {
    const value = mapAny(context, node.value);
    return new DefaultParam(line, column, start, end, raw, param, value);
  }

  if (node.splat) {
    return new Rest(line, column, start, end, raw, param);
  }

  return param;
}
