import { Try as CoffeeTry } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Try } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapTry(context: ParseContext, node: CoffeeTry): Try {
  const { line, column, start, end, raw } = getLocation(context, node);

  return new Try(
    line,
    column,
    start,
    end,
    raw,
    mapPossiblyEmptyBlock(context, node.attempt),
    node.errorVariable ? mapAny(context, node.errorVariable) : null,
    mapPossiblyEmptyBlock(context, node.recovery),
    mapPossiblyEmptyBlock(context, node.ensure)
  );
}
