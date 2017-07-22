import { Arr } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { ArrayInitialiser } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapArr(context: ParseContext, node: Arr): ArrayInitialiser {
  let { line, column, start, end, raw } = getLocation(context, node);
  let members = node.objects.map(object => mapAny(context, object));
  return new ArrayInitialiser(line, column, start, end, raw, members);
}
