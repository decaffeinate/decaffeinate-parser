#!/usr/bin/env node -r ts-node/register -r babel-register

import { readdirSync, readFileSync, statSync } from 'fs';
import { basename, extname, join } from 'path';
import { parse } from '../src/parser';

for (let i = 2; i < process.argv.length; i++) {
  processPath(process.argv[i]);
}

function processPath(path: string): void {
  const stat = statSync(path);

  if (stat.isDirectory()) {
    processDirectory(path);
  } else if (stat.isFile() && isCoffeeScriptFile(path)) {
    processFile(path);
  }
}

function processFile(path: string): void {
  const content = readFileSync(path, { encoding: 'utf8' });
  try {
    parse(content);
    console.log(`OK ${path}`);
  } catch (ex) {
    console.log(`NOT OK ${path}`);
    console.log(`    ${ex.message}`);
    console.log(
      ex.stack
        .split('\n')
        .map((line: string) => `   ${line}`)
        .join('\n')
    );
  }
}

function processDirectory(path: string): void {
  readdirSync(path).forEach(child => {
    if (child[0] === '.' || child === 'node_modules') {
      return;
    }

    processPath(join(path, child));
  });
}

function isCoffeeScriptFile(path: string): boolean {
  return extname(path) === '.coffee' && basename(path, '.coffee').length > 0;
}
