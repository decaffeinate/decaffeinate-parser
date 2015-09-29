import { deepEqual } from 'assert';
import { join } from 'path';
import { parse } from '../src/parser';
import { readFileSync, readdirSync } from 'fs';

const examplesPath = join(__dirname, 'examples');
readdirSync(examplesPath).forEach(entry => {
  const dir = join(examplesPath, entry);
  it(entry, () => {
    const output = JSON.parse(readFileSync(join(dir, 'output.json'), { encoding: 'utf8' }));
    const input = readFileSync(join(dir, 'input.coffee'), { encoding: 'utf8' });
    deepEqual(parse(input), output);
  });
});
