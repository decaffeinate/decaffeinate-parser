import { LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import LinesAndColumns from 'lines-and-columns';

/**
 * Assumes first_line/first_column are correct.
 */
export default function fixInvalidLocationData(locationData: LocationData, linesAndColumns: LinesAndColumns): LocationData {
  let { last_line, last_column } = locationData;
  let indexForLocation = linesAndColumns.indexForLocation({ line: last_line, column: last_column });

  if (indexForLocation !== null) {
    return locationData;
  } else {
    let offset = 1;

    for (;;) {
      let index = linesAndColumns.indexForLocation({ line: last_line, column: last_column - offset });

      offset++;

      if (index !== null) {
        let location = linesAndColumns.locationForIndex(index + offset);

        if (!location) {
          throw new Error(
            `Unable to determine adjustment offset for incorrect location data: ` +
            `${JSON.stringify(locationData)}. No valid location found for index: ` +
            `${index + offset}`
          );
        }

        last_line = location.line;
        last_column = location.column;
        break;
      }
    }

    return {
      ...locationData,
      last_line,
      last_column
    };
  }
}
