import { TaggedTemplateCall } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes.js';
import { Node, String, TaggedTemplateLiteral } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapTaggedTemplateCall(
  context: ParseContext,
  node: TaggedTemplateCall
): Node {
  const { line, column, start, end, raw } = getLocation(context, node);
  if (!node.variable) {
    throw new Error('Expected tag in tagged template literal.');
  }
  const tag = mapAny(context, node.variable);
  if (node.args.length !== 1) {
    throw new Error(
      'Expected tagged template literal call to have exactly one argument.'
    );
  }
  const template = mapAny(context, node.args[0]);
  if (!(template instanceof String)) {
    throw new Error(
      'Expected tagged template literal argument to be a string.'
    );
  }
  return new TaggedTemplateLiteral(
    line,
    column,
    start,
    end,
    raw,
    tag,
    template
  );
}
