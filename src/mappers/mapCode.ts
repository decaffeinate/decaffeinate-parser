import { Code } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { BaseFunction, Function } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';
import mapBlock from './mapBlock';

export default function mapCode(context: ParseContext, node: Code): BaseFunction {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  if (node.bound || node.isGenerator) {
    throw new UnsupportedNodeError(node);
  }

  return new Function(
    line, column, start, end, raw, virtual,
    node.params.map(param => mapAny(context, param)),
    mapBlock(context, node.body)
  );
}
