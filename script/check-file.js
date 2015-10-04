#!/usr/bin/env babel-node

import { basename, extname, join } from 'path';
import { parse } from '../src/parser';
import { readFileSync, readdirSync, statSync } from 'fs';

for (let i = 2; i < process.argv.length; i++) {
  processPath(process.argv[i]);
}

/**
 * @param {string} path
 */
function processPath(path) {
  const stat = statSync(path);

  if (stat.isDirectory()) {
    processDirectory(path);
  } else if (stat.isFile() && isCoffeeScriptFile(path)) {
    processFile(path);
  }
}

/**
 * @param {string} path
 */
function processFile(path) {
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

/**
 * @param {string} path
 */
function processDirectory(path) {
  readdirSync(path).forEach(child => {
    if (child[0] === '.' || child === 'node_modules') {
      return;
    }

    processPath(join(path, child));
  });
}

/**
 * @param {string} path
 */
function isCoffeeScriptFile(path) {
  return extname(path) === '.coffee' && basename(path, '.coffee').length > 0;
}
