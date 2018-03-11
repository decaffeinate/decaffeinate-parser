import {
  Arr,
  Assign,
  Base,
  Call,
  IdentifierLiteral,
  Obj,
  Splat,
  StringLiteral,
  StringWithInterpolations,
  Value,
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import {CSXElement, Node} from '../nodes';
import getLocation from '../util/getLocation';
import getTemplateLiteralComponents from '../util/getTemplateLiteralComponents';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapCSX(context: ParseContext, node: Call): Node {
  let { line, column, start, end, raw } = getLocation(context, node);
  let [properties, children] = node.args;
  let mappedProperties = mapCSXProperties(context, properties);
  let mappedChildren = mapCSXChildren(context, children);
  return new CSXElement(line, column, start, end, raw, mappedProperties, mappedChildren);
}

function mapCSXProperties(context: ParseContext, properties: Base): Array<Node> {
  if (!(properties instanceof Value) || !(properties.base instanceof Arr)) {
    throw new Error('Expected a value for the CSX properties arg.');
  }
  let values = properties.base.objects;
  let resultProperties = [];
  for (let value of values) {
    if (!(value instanceof Value)) {
      throw new Error('Expected value for CSX property.');
    }
    if (value.base instanceof Obj) {
      for (let propertyAssignment of value.base.objects) {
        if (propertyAssignment instanceof Splat) {
          resultProperties.push(mapAny(context, propertyAssignment));
        } else if (propertyAssignment instanceof Assign) {
          if (!(propertyAssignment.value instanceof Value)) {
            throw new Error('Unexpected property assignment value.');
          }
          if (!(propertyAssignment.value.base instanceof StringLiteral)) {
            resultProperties.push(mapAny(context, propertyAssignment.value));
          }
        } else {
          throw new Error('Unexpected property assignment object field in CSX.');
        }
      }
    } else if (value.base instanceof IdentifierLiteral) {
      // Do nothing; we don't need to consider this as a node to transform.
    } else {
      throw new Error('Unexpected property assignment in CSX.');
    }
  }
  return resultProperties;
}

function mapCSXChildren(context: ParseContext, children: Base | null): Array<Node | null> {
  if (!children) {
    return [];
  }
  if (!(children instanceof Value)) {
    throw new Error('Expected a value for the CSX children arg.');
  }
  if (children.base instanceof StringLiteral) {
    return [];
  } else if (!(children.base instanceof StringWithInterpolations)) {
    throw new Error('Expected a valid CSX children arg.');
  }
  let childInterpolatedString = children.base.body.expressions[0];
  let {unmappedExpressions} = getTemplateLiteralComponents(context, childInterpolatedString);
  return unmappedExpressions.map(child => child ? mapAny(context, child) : null);
}
