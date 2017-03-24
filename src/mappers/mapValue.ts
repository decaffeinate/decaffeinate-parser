import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import {
  Access, Index, Literal, LocationData, Slice as CoffeeSlice, Value
} from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import {
  Identifier, MemberAccessOp, Node, ProtoMemberAccessOp, Slice, SoakedMemberAccessOp,
  SoakedProtoMemberAccessOp
} from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import { UnsupportedNodeError } from './mapAnyWithFallback';
import mapBase from './mapBase';

export default function mapValue(context: ParseContext, node: Value): Node {
  let base = mapBase(context, node);

  return node.properties.reduce(
    (reduced, property) => propertyReducer(context, base, reduced, property),
    mapAny(context, node.base)
  );
}

function propertyReducer(context: ParseContext, base: Node, reduced: Node, property: Access | Index | CoffeeSlice): Node {
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

    if (last === null) {
      throw new Error(`cannot find offset of last character of property: ${inspect(property)}`);
    }

    let isPrototypeAccess = startToken.type === SourceType.PROTO;

    if (isPrototypeAccess) {
      let AccessOp = property.soak ? SoakedProtoMemberAccessOp : ProtoMemberAccessOp;

      return new AccessOp(
        base.line,
        base.column,
        base.start,
        last + 1,
        context.source.slice(base.start, last + 1),
        reduced
      );
    } else {
      let member = mapAny(context, name);

      if (!(member instanceof Identifier)) {
        throw new Error(`unexpected non-Identifier access member: ${inspect(member)}`);
      }

      let AccessOp = property.soak ? SoakedMemberAccessOp : MemberAccessOp;

      return new AccessOp(
        base.line,
        base.column,
        base.start,
        last + 1,
        context.source.slice(base.start, last + 1),
        reduced,
        member
      );
    }
  } else if (property instanceof CoffeeSlice) {
    let last = context.linesAndColumns.indexForLocation({
      line: property.locationData.last_line,
      column: property.locationData.last_column
    });

    if (last === null) {
      throw new Error(`cannot find offset of last character of slice: ${inspect(property)}`);
    }

    return new Slice(
      base.line,
      base.column,
      base.start,
      last + 1,
      context.source.slice(base.start, last + 1),
      reduced,
      property.range.from ? mapAny(context, property.range.from) : null,
      property.range.to ? mapAny(context, property.range.to) : null,
      !property.range.exclusive
    );
  } else {
    throw new UnsupportedNodeError(property);
  }
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
