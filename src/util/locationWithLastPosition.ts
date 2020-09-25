import { LocationData } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';

export default function locationWithLastPosition(
  loc: LocationData,
  last: LocationData
): LocationData {
  return {
    first_line: loc.first_line,
    first_column: loc.first_column,
    last_line: last.last_line,
    last_column: last.last_column,
  };
}
