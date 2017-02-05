import { Call as CoffeeCall } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { FunctionApplication, Node } from '../nodes';
import isHeregexTemplateNode from '../util/isHeregexTemplateNode';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapCall(context: ParseContext, node: CoffeeCall): Node {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  if (node.isNew || node.isSuper || node.soak || node.do || isHeregexTemplateNode(node, context)) {
    throw new UnsupportedNodeError(node);
  }

  if (!node.variable) {
    // This should only happen when `isSuper` is true.
    throw new UnsupportedNodeError(node);
  }

  return new FunctionApplication(
    line,
    column,
    start,
    end,
    raw,
    virtual,
    mapAny(context, node.variable),
    node.args.map(arg => mapAny(context, arg))
  );
}
