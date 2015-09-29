/**
 * @param {Object} node A CoffeeScript node.
 * @returns {string}
 */
export default function type(node) {
  return node.constructor.name;
}
