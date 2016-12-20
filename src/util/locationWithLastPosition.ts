import { LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';

export default function locationWithLastPosition(loc: LocationData, last: LocationData): LocationData {
  return {
    first_line: loc.first_line,
    first_column: loc.first_column,
    last_line: last.last_line,
    last_column: last.last_column
  };
}
