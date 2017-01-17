import { Assign, Obj, Value } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Identifier, ObjectInitialiser, ObjectInitialiserMember, String } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';
import mapValue from './mapValue';

export default function mapObj(context: ParseContext, node: Obj): ObjectInitialiser {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  let members: Array<ObjectInitialiserMember> = node.properties.map(property => {
    if (property instanceof Value) {
      // shorthand property
      let value = mapValue(context, property);

      if (!(value instanceof Identifier)) {
        throw new UnsupportedNodeError(property);
      }

      return new ObjectInitialiserMember(
        value.line, value.column, value.start, value.end, value.raw, value.virtual,
        value,
        value
      );
    } else if (property instanceof Assign && property.context === 'object') {
      let { line, column, start, end, raw, virtual } = mapBase(context, property);

      let key = mapAny(context, property.variable);
      let expression = mapAny(context, property.value);

      if (!(key instanceof Identifier) && !(key instanceof String)) {
        throw new UnsupportedNodeError(property);
      }

      return new ObjectInitialiserMember(
        line, column, start, end, raw, virtual,
        key,
        expression
      );
    } else {
      throw new UnsupportedNodeError(property);
    }
  });

  return new ObjectInitialiser(
    line, column, start, end, raw, virtual,
    members
  );
}
