import { Base } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { inspect } from 'util';

export default class UnsupportedNodeError extends Error {
  readonly node: Base;

  constructor(node: Base, message: string | null = null) {
    const prefix = message ? `${message}\n\n` : '';
    super(`${prefix}node type '${node.constructor.name}' is not supported: ${inspect(node)}`);

    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, UnsupportedNodeError.prototype);

    this.node = node;
  }
}
