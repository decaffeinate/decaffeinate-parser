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

/**
 * Compute the padding (the extra spacing to remove) for the given herestring.
 *
 * CoffeeScript removes spacing in the following situations:
 * - If the first or last line is completely blank, it is removed.
 * - The "common leading whitespace" is removed from each line if possible. This
 *   is computed by taking the smallest nonzero amount of leading whitespace
 *   among all lines except the partial line immediately after the open quotes.
 *   Note that this "smallest nonzero amount" behavior doesn't just ignore blank
 *   lines; *any* line with no leading whitespace will be ignored when
 *   calculating this value. Even though the initial partial line has no effect
 *   when computing leading whitespace, the common leading whitespace is still
 *   removed from that line if possible.
 * - Due to a bug in CoffeeScript, if the first full line (the one after the
 *   partial line) is nonempty and has indent zero, the entire string is
 *   considered to have "common leading whitespace" zero.
 * - Due to another bug in CoffeeScript, if the herestring has exactly two lines
 *   that both consist of only whitespace, the whitespace and newline is removed
 *   from the first line, but the second line keeps all of its whitespace.
 *
 * See the stringToken function in lexer.coffee in the CoffeeScript source code
 * for CoffeeScript's implementation of this.
 *
 * The "padding" array returned by this function is an array of ranges of
 * whitespace to remove.
 */
function parseHerestring(string, quote, offset=0) {
  let { error, data } = parseQuotedString(string, quote);
  if (error) {
    return { type: 'error', error };
  }
  let ranges = getLeadingWhitespaceRanges(string, 3, string.length - 3);

  let padding = [];
  if (ranges.length >= 2) {
    let indentSize;
    let [firstFullLineIndentStart, firstFullLineIndentEnd] = ranges[1];
    if (firstFullLineIndentStart === firstFullLineIndentEnd &&
        string[firstFullLineIndentEnd] !== '\n' &&
        firstFullLineIndentEnd !== string.length - 3) {
      // Replicate a bug in CoffeeScript: treat the indent level as 0 if the
      // first full line is nonempty and has indent zero.
      indentSize = 0;
    } else {
      // The first line (a partial line) is ignored when computing indent.
      indentSize = sharedIndentSize(ranges.slice(1));
    }
    let removeInitialIndent = function(start, end) {
      if (indentSize > 0 && end - start >= indentSize) {
        padding.push([offset + start, offset + start + indentSize]);
      }
    };

    let [initialStart, initialEnd] = ranges[0];
    if (string[initialEnd] === '\n') {
      padding.push([offset + initialStart, offset + initialEnd + 1]);
    } else {
      removeInitialIndent(initialStart, initialEnd);
    }

    ranges.slice(1, ranges.length - 1).forEach(
      ([start, end]) => removeInitialIndent(start, end));

    let [finalStart, finalEnd] = ranges[ranges.length - 1];
    if (finalEnd === string.length - 3) {
      // Replicate a bug in CoffeeScript: if the first line was removed due to
      // only having whitespace, and there are exactly two lines, don't run the
      // remove-if-only-whitespace code for the second line.
      if (!(ranges.length === 2 && finalStart === initialEnd + 1)) {
        padding.push([offset + finalStart - 1, offset + finalEnd])
      }
    } else {
      removeInitialIndent(finalStart, finalEnd);
    }
  }

  let contentStart = offset + 3;
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
 * Determines the indents in the given string for herestring processing.
 *
 * @param {string} source
 * @param {number=} start
 * @param {number=} end
 * @returns Array<Array<number>>}
 */
function getLeadingWhitespaceRanges(source, start=0, end=source.length) {
  const ranges = [];
  // Note that we want to include the end index in our search since it might be
  // the "first character" of an empty line.
  for (let index = start; index <= end; index++) {
    if (index === start || source[index - 1] === '\n') {
      let start = index;
      while (source[index] === ' ' || source[index] === '\t') {
        index++;
      }
      ranges.push([start, index]);
    }
  }
  return ranges;
}

/**
 * @param {Array<Array<number>>} ranges
 * @returns {number}
 */
function sharedIndentSize(ranges) {
  let size = null;

  ranges.forEach(([start, end]) => {
    if (start === end) {
      return;
    }
    if (size === null || end - start < size) {
      size = end - start;
    }
  });

  return size === null ? 0 : size;
}
