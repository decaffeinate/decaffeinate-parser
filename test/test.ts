import { deepEqual, equal } from 'assert';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import * as stringify from 'json-stable-stringify';
import { join } from 'path';
import { Node, Program } from '../src/nodes';
import { parse, traverse } from '../src/parser';

function defineTests(): void {
  defineExamplesDir(join(__dirname, 'examples'), true, true);
  defineExamplesDir(join(__dirname, 'cs1-examples'), true, false);
  defineExamplesDir(join(__dirname, 'cs2-examples'), false, true);
}

function defineExamplesDir(examplesPath: string, shouldTestCS1: boolean, shouldTestCS2: boolean): void {
  readdirSync(examplesPath).forEach(entry => defineTestsForEntry(examplesPath, entry, shouldTestCS1, shouldTestCS2));
}

function defineTestsForEntry(examplesPath: string, entry: string, shouldTestCS1: boolean, shouldTestCS2: boolean): void {
  let dir = join(examplesPath, entry);
  let configPath = join(dir, '_config.js');
  let config = requireOptional(configPath) || {};
  let testFn = config.only ? it.only : config.skip ? it.skip : it;
  let testName = config.description || entry;
  if (shouldTestCS1) {
    defineTest(dir, testFn, testName, false);
  }
  if (shouldTestCS2) {
    defineTest(dir, testFn, testName, true);
  }
}

function defineTest(dir: string, testFn: typeof it.skip, testName: string, useCS2: boolean): void {
  let fullTestName = `${useCS2 ? 'CS2' : 'CS1'}: ${testName}`;
  testFn(fullTestName, () => {
    let input = readFileSync(join(dir, 'input.coffee'), { encoding: 'utf8' });
    let actual = stripExtraInfo(stripContext(parse(input, {useCS2})));
    writeFileSync(join(dir, `_actual_${useCS2 ? 'cs2' : 'cs1'}.json`), stringify(actual, {space: 2}), { encoding: 'utf8' });
    if (process.env['OVERWRITE_EXPECTED_OUTPUT'] === 'true') {
      writeFileSync(join(dir, 'output.json'), stringify(actual, {space: 2}), { encoding: 'utf8' });
    }
    let expected = JSON.parse(readFileSync(join(dir, 'output.json'), { encoding: 'utf8' }));
    deepEqual(actual, expected);
  });
}

function stripContext(programNode: Program): Program {
  delete programNode.context;
  return programNode;
}

function stripExtraInfo(node: Node): Node {
  traverse(node, (node, parent) => {
    equal(node.parentNode, parent);
    delete node.parentNode;
  });
  return node;
}

// tslint:disable-next-line no-any
function requireOptional(path: string): any {
  try {
    return require(path);
  } catch (err) {
    return null;
  }
}

defineTests();
