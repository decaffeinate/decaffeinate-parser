import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { Access, Literal, LocationData, Value } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { MemberAccessOp, Node } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';

export default function mapValue(context: ParseContext, node: Value): Node {
  let result = mapAny(context, node.base);

  for (let property of node.properties) {
    if (property instanceof Access && !property.soak) {
      let name = property.name;

      if (!(name instanceof Literal)) {
        throw new Error(`unexpected non-Literal property access name: ${inspect(name)}`);
      }

      let startToken = tokenAtLocation(context, property.locationData);

      if (!startToken) {
        throw new Error(`cannot find token at start of property: ${inspect(property)}`);
      }

      if (startToken.type === SourceType.PROTO) {
        throw new UnsupportedNodeError(property);
      }

      let last = context.linesAndColumns.indexForLocation({
        line: property.locationData.last_line,
        column: property.locationData.last_column
      });

      result = new MemberAccessOp(
        result.line,
        result.column,
        result.start,
        last + 1,
        context.source.slice(result.start, last + 1),
        false,
        result,
        name.value
      );
    } else {
      throw new UnsupportedNodeError(property);
    }
  }

  return result;
}

function tokenAtLocation(context: ParseContext, location: LocationData): SourceToken | null {
  let start = context.linesAndColumns.indexForLocation({
    line: location.first_line,
    column: location.first_column
  });

  if (start === null) {
    return null;
  }

  let startTokenIndex = context.sourceTokens.indexOfTokenContainingSourceIndex(start);

  if (startTokenIndex === null) {
    return null;
  }

  return context.sourceTokens.tokenAtIndex(startTokenIndex);
}
