/**
 * @param {string} string
 * @param {number=} offset
 * @returns {*}
 */
export default function parseLiteral(string, offset=0) {
  if (string.slice(0, 3) === '"""' || string.slice(-3) === '"""') {
    return parseHerestring(string, '"""', offset);
  } else if (string.slice(0, 3) === "'''" || string.slice(-3) === "'''") {
    return parseHerestring(string, "'''", offset);
  } else if (string[0] === "'" || string[string.length - 1] === "'") {
    return parseQuotedString(string, "'");
  } else if (string[0] === '"' || string[string.length - 1] === '"') {
    return parseQuotedString(string, '"');
  } else if (/^\d+$/.test(string)) {
    return parseInteger(string);
  } else if (/^\d*\.\d+$/.test(string)) {
    return parseFloatingPoint(string);
  } else if (/^0x[\da-f]+$/i.test(string)) {
    return parseHexidecimal(string);
  } else if (/^0o[0-7]+$/i.test(string)) {
    return parseOctal(string);
  }
}

function parseHerestring(string, quote, offset=0) {
  let { error, data } = parseQuotedString(string, quote);
  if (error) {
    return { type: 'error', error };
  }
  let { leadingMargin, trailingMargin, ranges } = getIndentInfo(string, 3, string.length - 3);
  let indentSize = sharedIndentSize(ranges);

  let padding = [];
  let contentStart = offset + 3;
  let contentEnd = offset + string.length - 3;

  if (leadingMargin) {
    padding.push([contentStart, contentStart + leadingMargin]);
  }

  if (indentSize) {
    ranges.forEach(([start, end]) => {
      if (end - start >= indentSize) {
        padding.push([offset + start, offset + start + indentSize]);
      }
    });
  }

  if (trailingMargin) {
    padding.push([contentEnd - trailingMargin, contentEnd]);
  }

  for (let i = padding.length - 1; i >= 0; i--) {
    let [ start, end ] = padding[i];
    data = data.slice(0, start - contentStart) + data.slice(end - contentStart);
  }

  return { type: 'Herestring', data, padding };
}

/**
 * @param {string} string
 * @param {string} quote
 * @returns {*}
 */
function parseQuotedString(string, quote) {
  if (string.slice(0, quote.length) !== quote || string.slice(-quote.length) !== quote) {
    return {
      type: 'error',
      error: {
        type: 'unbalanced-quotes',
        message: `tried to parse quoted string not wrapped in quotes: ${string}`
      }
    };
  }

  let p = quote.length;
  let result = '';

  function hex(count) {
    let digits = '';
    while (count-- > 0) {
      let chr = string[p++];
      if (/^[\da-f]$/i.test(chr)) {
        digits += chr;
      } else {
        return {
          type: 'error',
          error: {
            type: 'invalid-hex-character',
            message: `found ${chr} when looking for a hex character`
          }
        };
      }
    }
    return parseInt(digits, 16);
  }

  while (p < string.length - quote.length) {
    let chr;
    switch (chr = string[p++]) {
      case '\\':
        switch (chr = string[p++]) {
          case quote[0]:
            result += chr;
            break;

          case 'n':
            result += '\n';
            break;

          case 'r':
            result += '\r';
            break;

          case 't':
            result += '\t';
            break;

          case 'b':
            result += '\b';
            break;

          case 'v':
            result += '\v';
            break;

          case 'f':
            result += '\f';
            break;

          case 'x':
            let x = hex(2);
            if (x.type === 'error') {
              return x;
            }
            result += String.fromCharCode(x);
            break;

          case 'u':
            let u = hex(4);
            if (u.type === 'error') {
              return u;
            }
            result += String.fromCharCode(u);
            break;

          case '0':
            result += String.fromCharCode(0);
            break;

          default:
            result += chr;
            break;
        }
        break;

      case quote[0]:
        if (string.slice(p - 1, p - 1 + quote.length) === quote) {
          return {
            type: 'error',
            error: {
              type: 'unexpected-closing-quote',
              message: 'unexpected closing quote before the end of the string'
            }
          };
        } else {
          result += chr;
        }
        break;

      default:
        result += chr;
        break;
    }
  }

  return { type: 'string', data: result };
}

/**
 * @param {string} string
 * @returns {{type: string, data: number}}
 */
function parseInteger(string) {
  return { type: 'int', data: parseInt(string, 10) };
}

/**
 * @param {string} string
 * @returns {{type: string, data: number}}
 */
function parseFloatingPoint(string) {
  return { type: 'float', data: parseFloat(string) };
}

/**
 * @param {string} string
 * @returns {{type: string, data: number}}
 */
function parseHexidecimal(string) {
  return { type: 'int', data: parseInt(string.slice(2), 16) };
}

/**
 * @param {string} string
 * @returns {{type: string, data: number}}
 */
function parseOctal(string) {
  return { type: 'int', data: parseInt(string.slice(2), 8) };
}

/**
 * @param {string} source
 * @param {number=} start
 * @param {number=} end
 * @returns {{leadingMargin: number, trailingMargin: number, ranges: Array<Array<number>>}}
 */
function getIndentInfo(source, start=0, end=source.length) {
  const ranges = [];

  let leadingMargin = 0;
  while (source[start + leadingMargin] === ' ') {
    leadingMargin += ' '.length;
  }
  if (source[start + leadingMargin] === '\n') {
    leadingMargin += '\n'.length;
    start += leadingMargin;
  }

  let trailingMargin = 0;
  while (source[end - trailingMargin - ' '.length] === ' ') {
    trailingMargin += ' '.length;
  }
  if (source[end - trailingMargin - '\n'.length] === '\n') {
    trailingMargin += '\n'.length;
    end -= trailingMargin;
  }

  for (let index = start; index < end; index++) {
    if (index === start || source[index - 1] === '\n') {
      if (source[index] !== '\n') {
        let start = index;
        while (source[index] === ' ') {
          index++;
        }
        ranges.push([start, index]);
      }
    }
  }

  return {
    leadingMargin,
    trailingMargin,
    ranges
  };
}

/**
 * @param {Array<Array<number>>} ranges
 * @returns {number}
 */
function sharedIndentSize(ranges) {
  let size = null;

  ranges.forEach(([start, end]) => {
    if (size === null || (start !== end && end - start < size)) {
      size = end - start;
    }
  });

  return size === null ? 0 : size;
}
