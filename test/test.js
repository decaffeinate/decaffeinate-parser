import { deepEqual } from 'assert';
import { join } from 'path';
import { parse } from '../src/parser';
import { readFileSync, readdirSync, writeFileSync } from 'fs';

const examplesPath = join(__dirname, 'examples');
readdirSync(examplesPath).forEach(entry => {
  const dir = join(examplesPath, entry);
  it(entry, () => {
    const input = readFileSync(join(dir, 'input.coffee'), { encoding: 'utf8' });
    const actual = parse(input);
    writeFileSync(join(dir, '_actual.json'), JSON.stringify(actual, null, 2), { encoding: 'utf8' });
    const expected = JSON.parse(readFileSync(join(dir, 'output.json'), { encoding: 'utf8' }));
    deepEqual(actual, expected);
  });
});
