import {
  Base,
  PassthroughLiteral,
  Value,
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes.js';

export default function isCommentOnlyNode(base: Base): boolean {
  return (
    base instanceof Value &&
    base.base instanceof PassthroughLiteral &&
    base.base.value === ''
  );
}
