/* eslint-disable @typescript-eslint/camelcase */

import { LocationData } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import ParseContext from './ParseContext';
import { SourceRange } from './sourceRangeFromLocationData';

export default function locationDataFromSourceRange(
  context: ParseContext,
  sourceRange: SourceRange
): LocationData {
  const startLocationInclusive = context.linesAndColumns.locationForIndex(
    sourceRange.start
  );
  if (startLocationInclusive === null) {
    throw new Error('Expected start location for source range.');
  }
  const endLocationInclusive = context.linesAndColumns.locationForIndex(
    sourceRange.end - 1
  );
  if (endLocationInclusive === null) {
    throw new Error('Expected end location for source range.');
  }
  return {
    first_line: startLocationInclusive.line,
    first_column: startLocationInclusive.column,
    last_line: endLocationInclusive.line,
    last_column: endLocationInclusive.column
  };
}
