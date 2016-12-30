import { Base } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { Node } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export class UnsupportedNodeError extends Error {
  readonly node: Base;

  constructor(node: Base) {
    super(`node type '${node.constructor.name}' is not supported: ${inspect(node)}`);

    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, UnsupportedNodeError.prototype);

    this.node = node;
  }
}

export default function mapAnyWithFallback(context: ParseContext, node: Base, fallback: () => Node): Node {
  try {
    return mapAny(context, node);
  } catch (err) {
    if (err instanceof UnsupportedNodeError) {
      return fallback();
    } else {
      throw err;
    }
  }
}
