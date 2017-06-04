import { Try as CoffeeTry } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Try } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapTry(context: ParseContext, node: CoffeeTry): Try {
  let { line, column, start, end, raw } = mapBase(context, node);

  return new Try(
    line, column, start, end, raw,
    mapPossiblyEmptyBlock(context, node.attempt),
    node.errorVariable ? mapAny(context, node.errorVariable) : null,
    mapPossiblyEmptyBlock(context, node.recovery),
    mapPossiblyEmptyBlock(context, node.ensure)
  );
}
