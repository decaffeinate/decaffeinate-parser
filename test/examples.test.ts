import { readdirSync, readFileSync } from 'fs';
import { basename, join } from 'path';
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
  const dir = join(examplesPath, entry);
  const testFn = test;
  const testName = basename(entry, '.coffee');
  if (shouldTestCS1) {
    defineTest(dir, testFn, testName, false);
  }
  if (shouldTestCS2) {
    defineTest(dir, testFn, testName, true);
  }
}

function defineTest(path: string, testFn: typeof it.skip, testName: string, useCS2: boolean): void {
  const fullTestName = `${useCS2 ? 'CS2' : 'CS1'}: ${testName}`;
  testFn(fullTestName, () => {
    const input = readFileSync(path, { encoding: 'utf8' });
    const actual = stripExtraInfo(stripContext(parse(input, { useCS2 })));
    expect(actual).toMatchSnapshot();
  });
}

function stripContext(programNode: Program): Program {
  delete programNode.context;
  return programNode;
}

function stripExtraInfo(node: Node): Node {
  traverse(node, (node, parent) => {
    expect(node.parentNode).toEqual(parent);
    delete node.parentNode;
  });
  return node;
}

defineTests();
