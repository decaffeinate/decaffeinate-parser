import { deepEqual } from 'assert';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import * as stringify from 'json-stable-stringify';
import { join } from 'path';
import { Node, Program } from '../src/nodes';
import { parse } from '../src/parser';

let examplesPath = join(__dirname, 'examples');

readdirSync(examplesPath).forEach(entry => {
  let dir = join(examplesPath, entry);
  let configPath = join(dir, '_config.js');
  let config = requireOptional(configPath) || {};
  let testFn = config.only ? it.only : config.skip ? it.skip : it;

  testFn(config.description || entry, () => {
    let input = readFileSync(join(dir, 'input.coffee'), { encoding: 'utf8' });
    let actual = stripExtraInfo(stripContext(parse(input)));
    writeFileSync(join(dir, '_actual.json'), stringify(actual, {space: 2}), { encoding: 'utf8' });
    if (process.env['OVERWRITE_EXPECTED_OUTPUT'] === 'true') {
      writeFileSync(join(dir, 'output.json'), stringify(actual, {space: 2}), { encoding: 'utf8' });
    }
    let expected = JSON.parse(readFileSync(join(dir, 'output.json'), { encoding: 'utf8' }));
    deepEqual(actual, expected);
  });
});

function stripContext(programNode: Program) {
  delete programNode.context;
  return programNode;
}

function stripExtraInfo(node: Node) {
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

function requireOptional(path: string) {
  try {
    return require(path);
  } catch (err) {
    return null;
  }
}
