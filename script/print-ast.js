#!/usr/bin/env node -r babel-register

import repeat from 'string-repeat';
import { basename } from 'path';
import { inspect } from 'util';
import { parse as csrParse } from 'coffee-script-redux';
import { parse as dcParse } from '../src/parser';

const defaultPrintKey = (key, stream) => stream.write(key);
const defaultPrintPrimitive = (value, stream) => stream.write(inspect(value));

export default function print(node, stream, printKey=defaultPrintKey, printPrimitive=defaultPrintPrimitive, indent=0, seen=new Set()) {
  const thisIndent = repeat('  ', indent);
  const fullIndent = repeat('  ', indent + 1);

  if (Array.isArray(node)) {
    if (node.length === 0) {
      stream.write('[]');
    } else {
      stream.write(`[\n${fullIndent}`);
      node.forEach((child, i) => {
        print(child, stream, printKey, printPrimitive, indent + 1, seen);
        if (i !== node.length - 1) {
          stream.write(`,\n${fullIndent}`);
        }
      });
      stream.write(`\n${thisIndent}]`);
    }
    return;
  } else if (typeof node === 'undefined' || node === null) {
    printPrimitive(null, stream);
    return;
  } else if (typeof node !== 'object') {
    printPrimitive(node, stream);
    return;
  }

  if (seen.has(node)) {
    stream.write('[CIRCULAR]');
    return;
  } else {
    seen = new Set(Array.from(seen));
    seen.add(node);
  }

  const hoistedKeys = ['type', 'line', 'column', 'range', 'raw'];
  const extraKeys = Object.getOwnPropertyNames(node).filter(key => hoistedKeys.indexOf(key) < 0).sort();

  function writeKey(key) {
    stream.write(`\n${fullIndent}`);
    printKey(key, stream);
    stream.write(': ');
    if (key === 'range' && Array.isArray(node[key])) {
      stream.write(`[ ${node[key][0]}, ${node[key][1]} ]`);
    } else {
      print(node[key], stream, printKey, printPrimitive, indent + 1, seen);
    }
  }

  stream.write('{');

  hoistedKeys.forEach((key, i) => {
    if (key in node) {
      writeKey(key);
      if (extraKeys.length > 0 || i !== hoistedKeys.length - 1) {
        stream.write(',');
      }
    }
  });

  extraKeys.forEach((key, i) => {
    writeKey(key);
    if (i !== extraKeys.length - 1) {
      stream.write(',');
    }
  });

  stream.write(`\n${thisIndent}}`);
}

function showHelp(print=str => console.log(str)) {
  print(`${basename(process.argv[1])} [--json] [--redux] < file.coffee`);
}

if (require.main === module) {
  const { stdin, stdout } = process;

  function readStdin() {
    let result = '';

    return new Promise((resolve, reject) => {
      stdin.setEncoding('utf8');
      stdin.on('data', chunk => result += chunk);
      stdin.on('end', () => resolve(result));
      stdin.on('error', reject);
    });
  }

  let printKey = defaultPrintKey;
  let printPrimitive = defaultPrintPrimitive;
  let parse = dcParse;

  process.argv.slice(2).forEach(arg => {
    switch (arg) {
      case '--json':
        printKey = (value, stream) => stream.write(JSON.stringify(value));
        printPrimitive = printKey;
        break;

      case '--redux':
        parse = source => csrParse(source, { raw: true }).toBasicObject();
        break;

      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
        break;

      default:
        console.error(`error: unknown argument ${arg}`);
        showHelp(str => console.error(str));
        process.exit(1);
    }
  });

  readStdin()
    .then(stdin => {
      print(
        parse(stdin),
        stdout,
        printKey,
        printPrimitive
      );
    })
    .catch(err => {
      console.error(err.message);
      console.error(err.stack);
    });
}
