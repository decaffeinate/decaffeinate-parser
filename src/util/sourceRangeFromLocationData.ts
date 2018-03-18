import {LocationData} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import ParseContext from './ParseContext';

export type SourceRange = {
  start: number;
  end: number;
};

export default function sourceRangeFromLocationData(context: ParseContext, locationData: LocationData): SourceRange {
  let startIndexInclusive = context.linesAndColumns.indexForLocation({
    line: locationData.first_line,
    column: locationData.first_column,
  });
  if (startIndexInclusive === null) {
    throw new Error('Expected index for start of range.');
  }
  let endIndexInclusive = context.linesAndColumns.indexForLocation({
    line: locationData.last_line,
    column: locationData.last_column,
  });
  if (endIndexInclusive === null) {
    throw new Error('Expected index for end of range.');
  }
  return {
    start: startIndexInclusive,
    end: endIndexInclusive + 1,
  };
}
