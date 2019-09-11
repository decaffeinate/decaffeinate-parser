import {
  Base,
  ComputedPropertyName
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Node } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapComputedPropertyName(
  context: ParseContext,
  node: ComputedPropertyName
): Node {
  // ComputedPropertyName is the only Literal where the value isn't a primitive, so just
  // fake the type here for now.
  return mapAny(context, (node.value as unknown) as Base);
}
