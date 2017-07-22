import { Base, Op } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';

export function patchCoffeeScript(): void {
  Op.prototype.invert = invert;
  Base.prototype.invert = invert;
}

// tslint:disable-next-line no-any
function invert(): any {
  this.inverted = !this.inverted;
  return this;
}
