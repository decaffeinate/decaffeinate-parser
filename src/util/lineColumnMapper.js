
const NEWLINE = '\n';
const NEWLINE_LENGTH = '\n'.length;

/**
 * @param {string} source
 * @returns {function(number, number): number}
 */
export default function lineColumnMapper(source) {
  const offsets = [0];
  let offset = 0;

  source.split(NEWLINE).forEach(function(line) {
    offsets.push(offset);
    offset += line.length + NEWLINE_LENGTH;
  });

  const result = (line, column) => offsets[line] + column;
  result.invert = offset => {
    for (let line = offsets.length - 1; line >= 0; line--) {
      const lineStart = offsets[line];
      if (offset >= lineStart) {
        return { line, column: offset - lineStart };
      }
    }
  };
  return result;
}
