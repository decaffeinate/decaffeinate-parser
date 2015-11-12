export function patchCoffeeScript({ nodes: parse }) {
  const Op = parse('a + b').expressions[0].constructor;
  const Base = Op.__super__.constructor;

  Op.prototype.invert = invert;
  Base.prototype.invert = invert;
}

function invert() {
  this.inverted = !this.inverted;
  return this;
}
