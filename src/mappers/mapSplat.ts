import { Splat } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Spread } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapSplat(context: ParseContext, node: Splat): Spread {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);
  return new Spread(line, column, start, end, raw, virtual, mapAny(context, node.name));
}
