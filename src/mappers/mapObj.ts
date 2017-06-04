import { Assign, Comment, Obj, Value } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { AssignOp, Identifier, ObjectInitialiser, ObjectInitialiserMember, String } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';
import mapValue from './mapValue';

export default function mapObj(context: ParseContext, node: Obj): ObjectInitialiser {
  let { line, column, start, end, raw } = mapBase(context, node);

  let members: Array<ObjectInitialiserMember | AssignOp> = [];

  for (let property of node.properties) {
    if (property instanceof Value) {
      // shorthand property
      let value = mapValue(context, property);

      if (!(value instanceof Identifier)) {
        throw new UnsupportedNodeError(property);
      }

      members.push(new ObjectInitialiserMember(
        value.line, value.column, value.start, value.end, value.raw,
        value,
        value
      ));
    } else if (property instanceof Assign && property.context === 'object') {
      let { line, column, start, end, raw } = mapBase(context, property);

      let key = mapAny(context, property.variable);
      let expression = mapAny(context, property.value);

      if (!(key instanceof Identifier) && !(key instanceof String)) {
        throw new UnsupportedNodeError(property);
      }

      members.push(new ObjectInitialiserMember(
        line, column, start, end, raw,
        key,
        expression
      ));
    } else if (property instanceof Assign) {
      let { line, column, start, end, raw } = mapBase(context, property);
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
