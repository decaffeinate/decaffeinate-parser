import { deepEqual } from 'assert';
import { join } from 'path';
import { parse } from '../src/parser';
import { readFileSync, readdirSync, writeFileSync } from 'fs';

let examplesPath = join(__dirname, 'examples');

readdirSync(examplesPath).forEach(entry => {
  let dir = join(examplesPath, entry);
  let configPath = join(dir, '_config.js');
  let config = requireOptional(configPath) || {};
  let testFn = config.only ? it.only : config.skip ? it.skip : it;

  testFn(config.description || entry, () => {
    let input = readFileSync(join(dir, 'input.coffee'), { encoding: 'utf8' });
    let actual = stripExtraInfo(parse(input));
    writeFileSync(join(dir, '_actual.json'), JSON.stringify(actual, null, 2), { encoding: 'utf8' });
    let expected = JSON.parse(readFileSync(join(dir, 'output.json'), { encoding: 'utf8' }));
    deepEqual(actual, expected);
  });
});

function stripExtraInfo(node) {
  if (node && typeof node === 'object') {
    for (let key in node) {
      if (key === 'start' || key === 'end') {
        delete node[key];
      } else if (key === 'virtual') {
        if (node[key] === false) {
          delete node[key];
        } else {
          delete node.line;
          delete node.column;
          delete node.start;
          delete node.end;
          delete node.range;
          delete node.raw;
        }
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
