import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import { Access, Literal, LocationData, Value } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import { Identifier, MemberAccessOp, Node, ProtoMemberAccessOp, SoakedMemberAccessOp, SoakedProtoMemberAccessOp } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';

export default function mapValue(context: ParseContext, node: Value): Node {
  let result = mapAny(context, node.base);

  for (let property of node.properties) {
    if (property instanceof Access) {
      let name = property.name;

      if (!(name instanceof Literal)) {
        throw new Error(`unexpected non-Literal property access name: ${inspect(name)}`);
      }

      let startTokenIndex = tokenIndexAtLocation(context, property.locationData);
      let startToken = startTokenIndex && context.sourceTokens.tokenAtIndex(startTokenIndex);

      if (startToken && property.soak) {
        if (startToken.type !== SourceType.EXISTENCE) {
          throw new Error(`expected EXISTENCE token ('?') but got ${SourceType[startToken.type]}: ${inspect(startToken)}`);
        }

        startTokenIndex = startTokenIndex && startTokenIndex.next();
        startToken = startTokenIndex && context.sourceTokens.tokenAtIndex(startTokenIndex);
      }

      if (!startToken) {
        throw new Error(`cannot find token at start of property: ${inspect(property)}`);
      }

      let last = context.linesAndColumns.indexForLocation({
        line: property.locationData.last_line,
        column: property.locationData.last_column
      });

      let isPrototypeAccess = startToken.type === SourceType.PROTO;

      if (isPrototypeAccess) {
        let AccessOp = property.soak ? SoakedProtoMemberAccessOp : ProtoMemberAccessOp;

        result = new AccessOp(
          result.line,
          result.column,
          result.start,
          last + 1,
          context.source.slice(result.start, last + 1),
          result
        );
      } else {
        let member = mapAny(context, name);

        if (!(member instanceof Identifier)) {
          throw new Error(`unexpected non-Identifier access member: ${inspect(member)}`);
        }

        let AccessOp = property.soak ? SoakedMemberAccessOp : MemberAccessOp;

        result = new AccessOp(
          result.line,
          result.column,
          result.start,
          last + 1,
          context.source.slice(result.start, last + 1),
          result,
          member
        );
      }
    } else {
      throw new UnsupportedNodeError(property);
    }
  }

  return result;
}

function tokenIndexAtLocation(context: ParseContext, location: LocationData): SourceTokenListIndex | null {
  let start = context.linesAndColumns.indexForLocation({
    line: location.first_line,
    column: location.first_column
  });

  if (start === null) {
    return null;
  }

  return context.sourceTokens.indexOfTokenContainingSourceIndex(start);
}
