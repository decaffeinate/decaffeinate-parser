import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import {
  Access,
  Index,
  Literal,
  LocationData,
  Slice as CoffeeSlice,
  Value
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { inspect } from 'util';
import {
  DynamicMemberAccessOp,
  Identifier,
  MemberAccessOp,
  Node,
  ProtoMemberAccessOp,
  Slice,
  SoakedDynamicMemberAccessOp,
  SoakedMemberAccessOp,
  SoakedProtoMemberAccessOp,
  SoakedSlice
} from '../nodes';
import getLocation, { NodeLocation } from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import UnsupportedNodeError from '../util/UnsupportedNodeError';
import mapAny from './mapAny';

export default function mapValue(context: ParseContext, node: Value): Node {
  const location = getLocation(context, node);

  return node.properties.reduce(
    (reduced, property) => reduceProperty(context, location, reduced, property),
    mapAny(context, node.base)
  );
}

export function reduceProperty(
  context: ParseContext,
  location: NodeLocation,
  reduced: Node,
  property: Access | Index | CoffeeSlice
): Node {
  if (property instanceof Access) {
    const name = property.name;

    if (!(name instanceof Literal)) {
      throw new Error(
        `unexpected non-Literal property access name: ${inspect(name)}`
      );
    }

    let startTokenIndex = tokenIndexAtLocation(context, property.locationData);
    let startToken =
      startTokenIndex && context.sourceTokens.tokenAtIndex(startTokenIndex);

    if (startToken && property.soak) {
      if (startToken.type !== SourceType.EXISTENCE) {
        throw new Error(
          `expected EXISTENCE token ('?') but got ${
            SourceType[startToken.type]
          }: ${inspect(startToken)}`
        );
      }

      startTokenIndex = startTokenIndex && startTokenIndex.next();
      startToken =
        startTokenIndex && context.sourceTokens.tokenAtIndex(startTokenIndex);
    }

    if (!startToken) {
      throw new Error(
        `cannot find token at start of property: ${inspect(property)}`
      );
    }

    const last = context.linesAndColumns.indexForLocation({
      line: property.locationData.last_line,
      column: property.locationData.last_column
    });

    if (last === null) {
      throw new Error(
        `cannot find offset of last character of property: ${inspect(property)}`
      );
    }

    const isPrototypeAccess = startToken.type === SourceType.PROTO;

    if (isPrototypeAccess) {
      const AccessOp = property.soak
        ? SoakedProtoMemberAccessOp
        : ProtoMemberAccessOp;

      return new AccessOp(
        location.line,
        location.column,
        location.start,
        last + 1,
        context.source.slice(location.start, last + 1),
        reduced
      );
    } else {
      const member = mapAny(context, name);

      if (!(member instanceof Identifier)) {
        throw new Error(
          `unexpected non-Identifier access member: ${inspect(member)}`
        );
      }

      const AccessOp = property.soak ? SoakedMemberAccessOp : MemberAccessOp;

      return new AccessOp(
        location.line,
        location.column,
        location.start,
        last + 1,
        context.source.slice(location.start, last + 1),
        reduced,
        member
      );
    }
  } else if (property instanceof Index) {
    const NodeClass = property.soak
      ? SoakedDynamicMemberAccessOp
      : DynamicMemberAccessOp;
    const last = context.linesAndColumns.indexForLocation({
      line: property.locationData.last_line,
      column: property.locationData.last_column
    });
    if (last === null) {
      throw new Error(
        `cannot find offset of last character of index: ${inspect(property)}`
      );
    }

    return new NodeClass(
      location.line,
      location.column,
      location.start,
      last + 1,
      context.source.slice(location.start, last + 1),
      reduced,
      mapAny(context, property.index)
    );
  } else if (property instanceof CoffeeSlice) {
    const last = context.linesAndColumns.indexForLocation({
      line: property.locationData.last_line,
      column: property.locationData.last_column
    });

    if (last === null) {
      throw new Error(
        `cannot find offset of last character of slice: ${inspect(property)}`
      );
    }

    const SliceClass = property.soak ? SoakedSlice : Slice;
    return new SliceClass(
      location.line,
      location.column,
      location.start,
      last + 1,
      context.source.slice(location.start, last + 1),
      reduced,
      property.range.from ? mapAny(context, property.range.from) : null,
      property.range.to ? mapAny(context, property.range.to) : null,
      !property.range.exclusive
    );
  } else {
    throw new UnsupportedNodeError(property, 'Unexpected property access.');
  }
}

function tokenIndexAtLocation(
  context: ParseContext,
  location: LocationData
): SourceTokenListIndex | null {
  const start = context.linesAndColumns.indexForLocation({
    line: location.first_line,
    column: location.first_column
  });

  if (start === null) {
    return null;
  }

  return context.sourceTokens.indexOfTokenContainingSourceIndex(start);
}
