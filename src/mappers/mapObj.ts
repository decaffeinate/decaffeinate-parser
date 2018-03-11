import {Assign, ComputedPropertyName, Obj, Splat, Value} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import {AssignOp, ObjectInitialiser, ObjectInitialiserMember, Spread} from '../nodes';
import getLocation from '../util/getLocation';
import isCommentOnlyNode from '../util/isCommentOnlyNode';
import ParseContext from '../util/ParseContext';
import UnsupportedNodeError from '../util/UnsupportedNodeError';
import mapAny from './mapAny';
import mapValue from './mapValue';

export default function mapObj(context: ParseContext, node: Obj): ObjectInitialiser {
  let { line, column, start, end, raw } = getLocation(context, node);

  let members: Array<ObjectInitialiserMember | AssignOp | Spread> = [];

  for (let property of node.properties) {
    if (isCommentOnlyNode(property)) {
      continue;
    }
    let { line, column, start, end, raw } = getLocation(context, property);

    if (property instanceof Value) {
      // shorthand property
      let value = mapValue(context, property);

      members.push(new ObjectInitialiserMember(
        line, column, start, end, raw,
        value,
        null,
        false /* isComputed */
      ));
    } else if (property instanceof Assign && property.context === 'object') {
      let key = mapAny(context, property.variable);
      let expression = mapAny(context, property.value);
      let isComputed = property.variable instanceof Value &&
        property.variable.base instanceof ComputedPropertyName;

      members.push(new ObjectInitialiserMember(
        line, column, start, end, raw,
        key,
        expression,
        isComputed
      ));
    } else if (property instanceof Assign) {
      let assignee = mapAny(context, property.variable);
      let expression = mapAny(context, property.value);

      members.push(new AssignOp(
        line, column, start, end, raw,
        assignee,
        expression
      ));
    } else if (property instanceof Splat) {
      members.push(new Spread(line, column, start, end, raw, mapAny(context, property.name)));
    } else {
      throw new UnsupportedNodeError(property, 'Unexpected object member.');
    }
  }

  return new ObjectInitialiser(
    line, column, start, end, raw,
    members
  );
}
