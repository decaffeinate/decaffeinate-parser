import { Assign, Comment, Obj, Value } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { AssignOp, ObjectInitialiser, ObjectInitialiserMember } from '../nodes';
import ParseContext from '../util/ParseContext';
import UnsupportedNodeError from '../util/UnsupportedNodeError';
import mapAny from './mapAny';
import mapBase from './mapBase';
import mapValue from './mapValue';

export default function mapObj(context: ParseContext, node: Obj): ObjectInitialiser {
  let { line, column, start, end, raw } = mapBase(context, node);

  let members: Array<ObjectInitialiserMember | AssignOp> = [];

  for (let property of node.properties) {
    let { line, column, start, end, raw } = mapBase(context, property);

    if (property instanceof Value) {
      // shorthand property
      let value = mapValue(context, property);

      members.push(new ObjectInitialiserMember(
        line, column, start, end, raw,
        value,
        value
      ));
    } else if (property instanceof Assign && property.context === 'object') {
      let key = mapAny(context, property.variable);
      let expression = mapAny(context, property.value);

      members.push(new ObjectInitialiserMember(
        line, column, start, end, raw,
        key,
        expression
      ));
    } else if (property instanceof Assign) {
      let assignee = mapAny(context, property.variable);
      let expression = mapAny(context, property.value);

      members.push(new AssignOp(
        line, column, start, end, raw,
        assignee,
        expression
      ));
    } else if (property instanceof Comment) {
      // Ignore.
    } else {
      throw new UnsupportedNodeError(property, 'Unexpected object member.');
    }
  }

  return new ObjectInitialiser(
    line, column, start, end, raw,
    members
  );
}
