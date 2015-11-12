/**
 * @param {Object} node
 * @param {string} source
 * @param {function(number, number): number} map
 * @returns {string}
 */
export default function nodeSource(node, source, map) {
  return source.slice(
    map(node.first_line, node.first_column),
    map(node.last_line, node.last_column) + 1
  );
}
