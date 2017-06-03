import { deepEqual } from 'assert';
import { join } from 'path';
import stringify from 'json-stable-stringify';
import { inspect } from 'util';
import { parse } from '../src/parser';
import { readFileSync, readdirSync, writeFileSync } from 'fs';

let examplesPath = join(__dirname, 'examples');

runWithOptions({ useMappers: true, useFallback: process.env['USE_FALLBACK'] !== 'false' });
runWithOptions({ useMappers: false });

function runWithOptions(parseOptions: { useMappers?: boolean, useFallback?: boolean }) {
  context(`examples ${inspect(parseOptions)}`, () => {
    readdirSync(examplesPath).forEach(entry => {
      let dir = join(examplesPath, entry);
      let configPath = join(dir, '_config.js');
      let config = requireOptional(configPath) || {};
      let testFn = config.only ? it.only : config.skip ? it.skip : it;

      testFn(config.description || entry, () => {
        let input = readFileSync(join(dir, 'input.coffee'), { encoding: 'utf8' });
        let actual = stripExtraInfo(parse(input, parseOptions));
        writeFileSync(join(dir, '_actual.json'), stringify(actual, {space: 2}), { encoding: 'utf8' });
        if (process.env['OVERWRITE_EXPECTED_OUTPUT'] === 'true') {
          writeFileSync(join(dir, 'output.json'), stringify(actual, {space: 2}), { encoding: 'utf8' });
        }
        let expected = JSON.parse(readFileSync(join(dir, 'output.json'), { encoding: 'utf8' }));
        deepEqual(actual, expected);
      });
    });
  });
}

function stripExtraInfo(node) {
  if (node && typeof node === 'object') {
    for (let key in node) {
      if (node.range && (key === 'start' || key === 'end')) {
        delete node[key];
      } else {
        stripExtraInfo(node[key]);
      }
    }
  } else if (Array.isArray(node)) {
    for (let child of node) {
      stripExtraInfo(child);
    }
  }

  return node;
}

function requireOptional(path) {
  try {
    return require(path);
  } catch (err) {
    return null;
  }
}
