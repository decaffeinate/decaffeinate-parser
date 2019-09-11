import { Base } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import mapAny from '../mappers/mapAny';
import * as nodes from '../nodes';
import getTemplateLiteralComponents from './getTemplateLiteralComponents';
import ParseContext from './ParseContext';

export default function makeString(
  context: ParseContext,
  node: Base
): nodes.String {
  const {
    quasis,
    unmappedExpressions,
    start,
    end
  } = getTemplateLiteralComponents(context, node);
  const startLoc = context.linesAndColumns.locationForIndex(start);
  if (!startLoc) {
    throw new Error(`Expected to find a location for index ${start}.`);
  }
  const raw = context.source.slice(start, end);
  return new nodes.String(
    startLoc.line + 1,
    startLoc.column + 1,
    start,
    end,
    raw,
    quasis,
    unmappedExpressions.map(expr => (expr ? mapAny(context, expr) : null))
  );
}
