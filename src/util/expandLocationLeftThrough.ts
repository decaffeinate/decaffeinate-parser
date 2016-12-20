import { LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import ParseContext from './ParseContext';

export default function expandLocationLeftThrough(context: ParseContext, loc: LocationData, string: string): LocationData {
  let offset = context.linesAndColumns.indexForLocation({ line: loc.first_line, column: loc.first_column });

  offset = context.source.lastIndexOf(string, offset === null ? undefined : offset);

  let newLoc = context.linesAndColumns.locationForIndex(offset);

  if (offset < 0 || newLoc === null) {
    throw new Error(
      `unable to expand location starting at ${loc.first_line + 1}:${loc.first_column + 1} ` +
      `because it is not preceded by ${JSON.stringify(string)}`
    );
  }

  return {
    first_line: newLoc.line,
    first_column: newLoc.column,
    last_line: loc.last_line,
    last_column: loc.last_column
  };
}
