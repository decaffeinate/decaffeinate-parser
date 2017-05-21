import { Base } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import mapAny from '../mappers/mapAny';
import { String } from '../nodes';
import getTemplateLiteralComponents from './getTemplateLiteralComponents';
import ParseContext from './ParseContext';

export default function makeString(context: ParseContext, node: Base) {
  let { quasis, unmappedExpressions, start, end } = getTemplateLiteralComponents(context, node);
  let startLoc = context.linesAndColumns.locationForIndex(start);
  if (!startLoc) {
    throw new Error(`Expected to find a location for index ${start}.`);
  }
  let raw = context.source.slice(start, end);
  return new String(
    startLoc.line + 1, startLoc.column + 1, start, end, raw,
    quasis,
    unmappedExpressions.map(expr => expr ? mapAny(context, expr) : null),
  );
}
