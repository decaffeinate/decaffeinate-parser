/**
 * @param {Object} first
 * @param {Object} second
 * @returns {boolean}
 */
export default function locationsEqual(first, second) {
  return first.first_line === second.first_line &&
    first.first_column === second.first_column &&
    first.last_line === second.last_line &&
    first.last_column === second.last_column;
}
