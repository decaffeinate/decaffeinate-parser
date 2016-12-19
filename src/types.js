/* eslint-disable */

class Node {
  /** @type {string} */
  type = '';

  /** @type {number} */
  line = 0;

  /** @type {number} */
  column = 0;

  /** @type {[number]} */
  range = [0, 0];

  /** @type {string} */
  raw = '';
}

class Program extends Node {
  /** @type {Block} */
  body = null;
}

class Block extends Node {
  /** @type {[Expression]} */
  statements = [];
}

class Expression extends Node {}

class This extends Expression {}

class Conditional extends Expression {
  /** @type {Expression} */
  condition = null;

  /** @type {Expression|Block} */
  consequent = null;

  /** @type {?(Expression|Block)} */
  alternate = null;
}

class Function extends Expression {
  /** type {[Param]} */
  parameters = [];

  /** @type {Expression|Block} */
  body = null;
}
