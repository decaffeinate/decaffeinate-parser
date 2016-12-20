import { Base, Op } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';

export function patchCoffeeScript() {
  Op.prototype.invert = invert;
  Base.prototype.invert = invert;
}

function invert() {
  this.inverted = !this.inverted;
  return this;
}
