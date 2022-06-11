import {
  Assign,
  ComputedPropertyName,
  Obj,
  Splat,
  Value,
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes.js';
import {
  AssignOp,
  ObjectInitialiser,
  ObjectInitialiserMember,
  Spread,
} from '../nodes';
import getLocation from '../util/getLocation';
import isCommentOnlyNode from '../util/isCommentOnlyNode';
import ParseContext from '../util/ParseContext';
import UnsupportedNodeError from '../util/UnsupportedNodeError';
import mapAny from './mapAny';
import mapValue from './mapValue';

export default function mapObj(
  context: ParseContext,
  node: Obj
): ObjectInitialiser {
  const { line, column, start, end, raw } = getLocation(context, node);

  const members: Array<ObjectInitialiserMember | AssignOp | Spread> = [];

  for (const property of node.properties) {
    if (isCommentOnlyNode(property)) {
      continue;
    }
    const { line, column, start, end, raw } = getLocation(context, property);

    if (property instanceof Value) {
      // shorthand property
      const value = mapValue(context, property);
      const isComputed = property.base instanceof ComputedPropertyName;

      members.push(
        new ObjectInitialiserMember(
          line,
          column,
          start,
          end,
          raw,
          value,
          null,
          isComputed
        )
      );
    } else if (property instanceof Assign && property.context === 'object') {
      const key = mapAny(context, property.variable);
      const expression = mapAny(context, property.value);
      const isComputed =
        property.variable instanceof Value &&
        property.variable.base instanceof ComputedPropertyName;

      members.push(
        new ObjectInitialiserMember(
          line,
          column,
          start,
          end,
          raw,
          key,
          expression,
          isComputed
        )
      );
    } else if (property instanceof Assign) {
      const assignee = mapAny(context, property.variable);
      const expression = mapAny(context, property.value);

      members.push(
        new AssignOp(line, column, start, end, raw, assignee, expression)
      );
    } else if (property instanceof Splat) {
      members.push(
        new Spread(
          line,
          column,
          start,
          end,
          raw,
          mapAny(context, property.name)
        )
      );
    } else {
      throw new UnsupportedNodeError(property, 'Unexpected object member.');
    }
  }

  return new ObjectInitialiser(line, column, start, end, raw, members);
}
