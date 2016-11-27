/**
 * @param {string} string
 * @param {number=} offset
 * @returns {*}
 */
export default function parseLiteral(string) {
  if (string[0] === "'" || string[string.length - 1] === "'") {
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
