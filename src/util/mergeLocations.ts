import { LocationData } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';

export default function mergeLocations(
  left: LocationData,
  right: LocationData
): LocationData {
  let first_line;
  let first_column;
  let last_line;
  let last_column;

  if (left.first_line < right.first_line) {
    ({ first_line, first_column } = left);
  } else if (left.first_line > right.first_line) {
    ({ first_line, first_column } = right);
  } else if (left.first_column < right.first_column) {
    ({ first_line, first_column } = left);
  } else {
    ({ first_line, first_column } = right);
  }

  if (left.last_line < right.last_line) {
    ({ last_line, last_column } = right);
  } else if (left.last_line > right.last_line) {
    ({ last_line, last_column } = left);
  } else if (left.last_column < right.last_column) {
    ({ last_line, last_column } = right);
  } else {
    ({ last_line, last_column } = left);
  }

  return { first_line, first_column, last_line, last_column };
}
