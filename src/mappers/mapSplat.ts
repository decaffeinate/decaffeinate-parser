import { Splat } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Spread } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapSplat(context: ParseContext, node: Splat): Spread {
  let { line, column, start, end, raw } = getLocation(context, node);
  return new Spread(line, column, start, end, raw, mapAny(context, node.name));
}
