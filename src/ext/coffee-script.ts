import {
  Base as CS1Base,
  Op as CS1Op,
} from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Base, Op } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';

export function patchCoffeeScript(): void {
  CS1Op.prototype.invert = invert;
  CS1Base.prototype.invert = invert;
  Op.prototype.invert = invert;
  Base.prototype.invert = invert;
}

function invert<T extends { inverted: boolean }>(this: T): T {
  this.inverted = !this.inverted;
  return this;
}
