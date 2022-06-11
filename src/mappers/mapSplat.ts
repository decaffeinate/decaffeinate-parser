import { Splat } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes.js';
import { Spread } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapSplat(context: ParseContext, node: Splat): Spread {
  const { line, column, start, end, raw } = getLocation(context, node);
  return new Spread(line, column, start, end, raw, mapAny(context, node.name));
}
