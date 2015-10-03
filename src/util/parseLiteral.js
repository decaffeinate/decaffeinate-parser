/**
 * @param {string} string
 * @returns {string|number}
 */
export default function parseLiteral(string) {
  if (string.slice(0, 3) === '"""') {
    return parseQuotedString(string, '"""');
  } else if (string.slice(0, 3) === "'''") {
    return parseQuotedString(string, "'''");
  } else if (string[0] === "'") {
    return parseQuotedString(string, "'");
  } else if (string[0] === '"') {
    return parseQuotedString(string, '"');
  } else if (/^\d+$/.test(string)) {
    return parseInt(string);
  } else if (/^\d*\.\d+$/.test(string)) {
    return parseFloat(string);
  } else if (/^0x[\da-f]+$/i.test(string)) {
    return parseHexidecimal(string);
  }
}

/**
 * @param {string} string
 * @param {string} quote
 * @returns {string}
 */
function parseQuotedString(string, quote) {
  if (string.slice(0, quote.length) !== quote || string.slice(-quote.length) !== quote) {
    throw new Error(`tried to parse quoted string not wrapped in quotes: ${string}`);
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
        throw new Error(`found ${chr} when looking for a hex character`);
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
            result += String.fromCharCode(hex(2));
            break;

          case 'u':
            result += String.fromCharCode(hex(4));
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
          throw new Error('unexpected closing quote before the end of the string');
        } else {
          result += chr;
        }
        break;

      default:
        result += chr;
        break;
    }
  }

  return result;
}

/**
 * @param {string} string
 * @returns {number}
 */
function parseHexidecimal(string) {
  return parseInt(string.slice(2), 16);
}
