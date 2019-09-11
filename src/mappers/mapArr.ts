import { Arr } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { ArrayInitialiser } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapArr(
  context: ParseContext,
  node: Arr
): ArrayInitialiser {
  const { line, column, start, end, raw } = getLocation(context, node);
  const members = node.objects.map(object => mapAny(context, object));
  return new ArrayInitialiser(line, column, start, end, raw, members);
}
