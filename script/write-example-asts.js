#!/usr/bin/env babel-node

import { join, relative } from 'path';
import { parse as csrParse } from 'coffee-script-redux';
import print from './print-ast';
import { createWriteStream, readFileSync, readdirSync, statSync } from 'fs';

const examplesPath = join(__dirname, '../test/examples');
readdirSync(examplesPath).forEach(entry => {
  const dir = join(examplesPath, entry);
  const astPath = join(dir, 'output.json');
  if (!existsWithContent(astPath)) {
    console.log(`Writing ${relative(process.cwd(), astPath)}.`);
    const input = readFileSync(join(dir, 'input.coffee'), { encoding: 'utf8' });
    const output = createWriteStream(astPath);
    const printValue = (value, stream) => stream.write(JSON.stringify(value));
    print(csrParse(input, { raw: true }).toBasicObject(), output, printValue, printValue);
  }
});

function existsWithContent(path) {
  try {
    const stat = statSync(path);
    return stat.size > 0;
  } catch (ex) {
    return false;
  }
}
