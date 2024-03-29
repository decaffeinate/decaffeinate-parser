# decaffeinate-parser [![CI](https://github.com/decaffeinate/decaffeinate-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/decaffeinate/decaffeinate-parser/actions/workflows/ci.yml) [![package version](https://badge.fury.io/js/decaffeinate-parser.svg)](https://badge.fury.io/js/decaffeinate-parser)

This project uses the [official CoffeeScript
parser](https://github.com/jashkenas/coffeescript) to parse CoffeeScript source
code, then maps the AST generated by the parser to one more suitable for the
[decaffeinate project](https://github.com/eventualbuddha/decaffeinate) (based on
the AST generated by
[CoffeeScriptRedux](https://github.com/michaelficarra/CoffeeScriptRedux)).

This project might be useful to anyone who wants to work with a CoffeeScript
AST and prefers working with a saner AST.

## Install

```bash
# via yarn
$ yarn add decaffeinate-parser
# via npm
$ npm install decaffeinate-parser
```

## Usage

This example gets the names of the parameters in the `add` function:

```js
import { parse } from 'decaffeinate-parser';

const program = parse('add = (a, b) -> a + b');
const assignment = program.body.statements[0];
const fn = assignment.expression;

console.log(fn.parameters.map((param) => param.data)); // [ 'a', 'b' ]
```
