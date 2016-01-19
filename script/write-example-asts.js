#!/usr/bin/env node -r babel-register

import print from './print-ast';
import { createWriteStream, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { parse as csrParse } from 'coffee-script-redux';
import { parse as dcParse } from '../src/parser';

let parse = source => csrParse(source, { raw: true }).toBasicObject();
let force = false;

for (let i = 2; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case '--force':
    case '-f':
      force = true;
      break;

    case '--decaffeinate':
      parse = dcParse;
      break;

    default:
      throw new Error(`error: unexpected argument ${process.argv[i]}`);
  }
}

const examplesPath = join(__dirname, '../test/examples');
readdirSync(examplesPath).forEach(entry => {
  const dir = join(examplesPath, entry);
  const astPath = join(dir, 'output.json');
  if (force || !existsWithContent(astPath)) {
    console.log(`Writing ${relative(process.cwd(), astPath)}.`);
    const input = readFileSync(join(dir, 'input.coffee'), { encoding: 'utf8' });
    const output = createWriteStream(astPath);
    const printValue = (value, stream) => stream.write(JSON.stringify(value));
    print(parse(input), output, printValue, printValue);
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
