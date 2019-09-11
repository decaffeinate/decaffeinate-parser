import SourceToken from 'coffee-lex/dist/SourceToken';
import SourceTokenList from 'coffee-lex/dist/SourceTokenList';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import SourceType from 'coffee-lex/dist/SourceType';
import {
  Base,
  Literal,
  Op,
  Value
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Quasi } from '../nodes';
import isImplicitPlusOp from './isImplicitPlusOp';
import ParseContext from './ParseContext';
import parseString from './parseString';

export type TemplateLiteralComponents = {
  quasis: Array<Quasi>;
  unmappedExpressions: Array<Base | null>;
  start: number;
  end: number;
};

/**
 * Reconstruct template literal information given the coffee-lex tokens and the
 * CoffeeScript AST. Since the CoffeeScript AST doesn't attempt to represent a
 * template literal (it's a bunch of + operations instead), the source locations
 * are generally unreliable and we need to rely on the token locations instead.
 */
export default function getTemplateLiteralComponents(
  context: ParseContext,
  node: Base
): TemplateLiteralComponents {
  const tokens = context.sourceTokens;

  const quasis: Array<Quasi> = [];
  const unmappedExpressions: Array<Base | null> = [];

  const elements = getElements(node, context);
  const nodeRange = context.getRange(node);
  if (!nodeRange) {
    throw new Error('Expected valid range on template literal node.');
  }
  const { startTokenIndex, startToken } = getStartToken(nodeRange[0], tokens);

  let depth = 0;
  let lastToken = startToken;

  for (
    let tokenIndex: SourceTokenListIndex | null = startTokenIndex;
    tokenIndex;
    tokenIndex = tokenIndex.next()
  ) {
    const token = tokens.tokenAtIndex(tokenIndex);
    if (!token) {
      break;
    }
    if (
      token.type === SourceType.INTERPOLATION_START ||
      token.type === SourceType.CSX_OPEN_TAG_START
    ) {
      depth++;
      if (depth === 1) {
        quasis.push(findQuasi(lastToken, token, context, elements));
        lastToken = token;
      }
    } else if (
      token.type === SourceType.INTERPOLATION_END ||
      token.type === SourceType.CSX_SELF_CLOSING_TAG_END ||
      token.type === SourceType.CSX_CLOSE_TAG_END
    ) {
      depth--;
      if (depth === 0) {
        unmappedExpressions.push(
          findExpression(lastToken, token, context, elements)
        );
        lastToken = token;
      }
    } else if (depth === 0 && isTemplateLiteralEnd(token)) {
      quasis.push(findQuasi(lastToken, token, context, elements));
      lastToken = token;
      break;
    }
  }
  return {
    quasis,
    unmappedExpressions,
    start: startToken.start,
    end: lastToken.end
  };
}

function getElements(node: Base, context: ParseContext): Array<Base> {
  if (node instanceof Op && isImplicitPlusOp(node, context)) {
    if (!node.second) {
      throw new Error('Expected second operand on plus op.');
    }
    return [
      ...getElements(node.first, context),
      ...getElements(node.second, context)
    ];
  }
  return [node];
}

/**
 * Usually the start token is at the start index of the relevant AST node, but
 * if the start of the template literal is an interpolation, it's two before
 * that one, so check to see which case we are and return what we find.
 */
function getStartToken(
  start: number,
  tokens: SourceTokenList
): { startToken: SourceToken; startTokenIndex: SourceTokenListIndex } {
  let tokenIndex = tokens.indexOfTokenNearSourceIndex(start);
  for (let i = 0; i < 5; i++) {
    const token = tokens.tokenAtIndex(tokenIndex);
    if (!token) {
      throw new Error('Expected to find a start token in a template literal.');
    }
    if (isTemplateLiteralStart(token)) {
      return { startToken: token, startTokenIndex: tokenIndex };
    }
    const prevToken = tokenIndex.previous();
    if (!prevToken) {
      throw new Error(
        'Expected a previous token when searching for a template start.'
      );
    }
    tokenIndex = prevToken;
  }
  throw new Error('Expected a template literal start token.');
}

function findQuasi(
  leftToken: SourceToken,
  rightToken: SourceToken,
  context: ParseContext,
  elements: Array<Base>
): Quasi {
  const matchingElements = elements.filter(elem => {
    const range = context.getRange(elem);
    if (!range) {
      throw new Error('Unexpected invalid range.');
    }
    return range[0] >= leftToken.start && range[1] <= rightToken.end;
  });

  const start = leftToken.end;
  const end = rightToken.start;
  const startLoc = context.linesAndColumns.locationForIndex(leftToken.end);
  if (!startLoc) {
    throw new Error(`Expected to find a location for index ${leftToken.end}.`);
  }
  const raw = context.source.slice(start, end);

  if (matchingElements.length === 0) {
    return new Quasi(
      startLoc.line + 1,
      startLoc.column + 1,
      start,
      end,
      raw,
      ''
    );
  } else if (matchingElements.length === 1) {
    const element = matchingElements[0];
    let literal;
    if (element instanceof Literal) {
      literal = element;
    } else if (
      element instanceof Value &&
      element.properties.length === 0 &&
      element.base instanceof Literal
    ) {
      literal = element.base;
    } else {
      throw new Error(
        'Expected quasi element to be either a literal or a value containing only a literal.'
      );
    }
    const stringValue = parseString(literal.value);
    return new Quasi(
      startLoc.line + 1,
      startLoc.column + 1,
      start,
      end,
      raw,
      stringValue !== undefined ? stringValue : literal.value
    );
  } else {
    throw new Error(
      'Unexpectedly found multiple elements in string interpolation.'
    );
  }
}

function findExpression(
  leftToken: SourceToken,
  rightToken: SourceToken,
  context: ParseContext,
  elements: Array<Base>
): Base | null {
  const matchingElements = elements.filter(elem => {
    const range = context.getRange(elem);
    if (!range) {
      throw new Error('Unexpected invalid range.');
    }
    return range[0] >= leftToken.start && range[1] <= rightToken.end;
  });

  if (matchingElements.length === 0) {
    return null;
  } else if (matchingElements.length === 1) {
    return matchingElements[0];
  } else {
    throw new Error(
      'Unexpectedly found multiple elements in string interpolation.'
    );
  }
}

function isTemplateLiteralStart(token: SourceToken): boolean {
  return (
    [
      SourceType.DSTRING_START,
      SourceType.SSTRING_START,
      SourceType.TDSTRING_START,
      SourceType.TSSTRING_START,
      SourceType.HEREGEXP_START,
      SourceType.CSX_OPEN_TAG_END
    ].indexOf(token.type) >= 0
  );
}

function isTemplateLiteralEnd(token: SourceToken): boolean {
  return (
    [
      SourceType.DSTRING_END,
      SourceType.SSTRING_END,
      SourceType.TDSTRING_END,
      SourceType.TSSTRING_END,
      SourceType.HEREGEXP_END,
      SourceType.CSX_CLOSE_TAG_START
    ].indexOf(token.type) >= 0
  );
}
