import LinesAndColumns from 'lines-and-columns';
import fixInvalidLocationData from '../../src/util/fixInvalidLocationData';

describe('fixInvalidLocationData', () => {
  test('returns the location data unchanged when the last location exists', () => {
    let linesAndColumns = new LinesAndColumns('a');
    expect(
      fixInvalidLocationData({ first_line: 0, first_column: 0, last_line: 0, last_column: 0 }, linesAndColumns)
    ).toEqual(
      { first_line: 0, first_column: 0, last_line: 0, last_column: 0 }
    );
  });

  test('adjusts the last line and column back when past the end of a line', () => {
    let linesAndColumns = new LinesAndColumns('"""\na\n"""');
    expect(
      fixInvalidLocationData({ first_line: 0, first_column: 0, last_line: 1, last_column: 4 }, linesAndColumns)
    ).toEqual(
      { first_line: 0, first_column: 0, last_line: 2, last_column: 3 }
    );
  });
});
