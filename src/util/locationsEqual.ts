import { LocationData } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';

export default function locationsEqual(
  first: LocationData,
  second: LocationData
): boolean {
  return (
    first.first_line === second.first_line &&
    first.first_column === second.first_column &&
    first.last_line === second.last_line &&
    first.last_column === second.last_column
  );
}
