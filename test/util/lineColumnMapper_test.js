import lineColumnMapper from '../../src/util/lineColumnMapper';
import { deepEqual, strictEqual } from 'assert';

describe('lineColumMapper', () => {
  it('maps empty strings', () => {
    const map = lineColumnMapper('');
    deepEqual(map(0, 0), 0);
    deepEqual(map.invert(0), { line: 0, column: 0 });
  });

  it('maps single-line strings', () => {
    const map = lineColumnMapper('abcd');
    strictEqual(map(0, 0), 0);
    strictEqual(map(0, 1), 1);
    strictEqual(map(0, 2), 2);
    strictEqual(map(0, 3), 3);
    strictEqual(map(0, 4), 4);
    deepEqual(map.invert(0), { line: 0, column: 0 });
    deepEqual(map.invert(1), { line: 0, column: 1 });
    deepEqual(map.invert(2), { line: 0, column: 2 });
    deepEqual(map.invert(3), { line: 0, column: 3 });
    deepEqual(map.invert(4), { line: 0, column: 4 });
  });

  it('maps multi-line strings', () => {
    const map = lineColumnMapper('abc\nd\n\nef\n');
    strictEqual(map(0, 0), 0);
    strictEqual(map(0, 1), 1);
    strictEqual(map(0, 2), 2);
    strictEqual(map(0, 3), 3);
    strictEqual(map(1, 0), 4);
    strictEqual(map(1, 1), 5);
    strictEqual(map(2, 0), 6);
    strictEqual(map(3, 0), 7);
    strictEqual(map(3, 1), 8);
    strictEqual(map(3, 2), 9);
    deepEqual(map.invert(0), { line: 0, column: 0 });
    deepEqual(map.invert(1), { line: 0, column: 1 });
    deepEqual(map.invert(2), { line: 0, column: 2 });
    deepEqual(map.invert(3), { line: 0, column: 3 });
    deepEqual(map.invert(4), { line: 1, column: 0 });
    deepEqual(map.invert(5), { line: 1, column: 1 });
    deepEqual(map.invert(6), { line: 2, column: 0 });
    deepEqual(map.invert(7), { line: 3, column: 0 });
    deepEqual(map.invert(8), { line: 3, column: 1 });
    deepEqual(map.invert(9), { line: 3, column: 2 });
  });
});
