#!/usr/bin/env node -r ts-node/register -r babel-register

import { readdirSync, readFileSync, statSync } from 'fs';
import { basename, extname, join } from 'path';

// TODO: Change to an import when parser is TypeScript.
// tslint:disable-next-line:no-var-requires
const parse = require('../src/parser').parse;

for (let i = 2; i < process.argv.length; i++) {
  processPath(process.argv[i]);
}

function processPath(path: string) {
  const stat = statSync(path);

  if (stat.isDirectory()) {
    processDirectory(path);
  } else if (stat.isFile() && isCoffeeScriptFile(path)) {
    processFile(path);
  }
}

function processFile(path: string) {
  const content = readFileSync(path, { encoding: 'utf8' });
  try {
    parse(content);
    console.log(`OK ${path}`);
  } catch (ex) {
    console.log(`NOT OK ${path}`);
    console.log(`    ${ex.message}`);
    console.log(ex.stack.split('\n').map(line => `   ${line}`).join('\n'));
  }
}

function processDirectory(path: string) {
  readdirSync(path).forEach(child => {
    if (child[0] === '.' || child === 'node_modules') {
      return;
    }

    processPath(join(path, child));
  });
}

function isCoffeeScriptFile(path: string) {
  return extname(path) === '.coffee' && basename(path, '.coffee').length > 0;
}
