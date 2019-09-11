import {
  ExportAllDeclaration as CoffeeExportAllDeclaration,
  ExportDefaultDeclaration as CoffeeExportDefaultDeclaration,
  ExportNamedDeclaration as CoffeeExportNamedDeclaration,
  ExportSpecifierList,
  IdentifierLiteral,
  ImportDeclaration as CoffeeImportDeclaration,
  ImportNamespaceSpecifier,
  ImportSpecifierList,
  Literal,
  ModuleDeclaration,
  ModuleSpecifier as CoffeeModuleSpecifier,
  StringLiteral
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import * as nodes from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import UnsupportedNodeError from '../util/UnsupportedNodeError';
import mapAny from './mapAny';
import mapLiteral from './mapLiteral';
import notNull from '../util/notNull';

export default function mapModuleDeclaration(
  context: ParseContext,
  node: ModuleDeclaration
): nodes.Node {
  const { line, column, start, end, raw } = getLocation(context, node);

  if (node instanceof CoffeeImportDeclaration) {
    const clause = node.clause;
    let defaultBinding = null;
    let namespaceImport = null;
    let namedImports = null;

    if (clause) {
      defaultBinding =
        clause.defaultBinding &&
        mapIdentifierSpecifier(context, clause.defaultBinding);
      if (clause.namedImports instanceof ImportNamespaceSpecifier) {
        namespaceImport = mapStarSpecifier(context, clause.namedImports);
      } else if (clause.namedImports instanceof ImportSpecifierList) {
        namedImports = clause.namedImports.specifiers.map(specifier =>
          mapSpecifier(context, specifier)
        );
      }
    }

    if (!node.source) {
      throw new Error('Expected non-null source for import.');
    }
    const source = mapSource(context, node.source);
    return new nodes.ImportDeclaration(
      line,
      column,
      start,
      end,
      raw,
      defaultBinding,
      namespaceImport,
      namedImports,
      source
    );
  } else if (node instanceof CoffeeExportNamedDeclaration) {
    if (node.clause instanceof ExportSpecifierList) {
      const namedExports = node.clause.specifiers.map(specifier =>
        mapSpecifier(context, specifier)
      );
      const source = node.source ? mapSource(context, node.source) : null;
      return new nodes.ExportBindingsDeclaration(
        line,
        column,
        start,
        end,
        raw,
        namedExports,
        source
      );
    } else {
      const expression = mapAny(context, notNull(node.clause));
      return new nodes.ExportNamedDeclaration(
        line,
        column,
        start,
        end,
        raw,
        expression
      );
    }
  } else if (node instanceof CoffeeExportDefaultDeclaration) {
    const expression = mapAny(context, notNull(node.clause));
    return new nodes.ExportDefaultDeclaration(
      line,
      column,
      start,
      end,
      raw,
      expression
    );
  } else if (node instanceof CoffeeExportAllDeclaration) {
    if (!node.source) {
      throw new Error('Expected non-null source for star export.');
    }
    const source = mapSource(context, node.source);
    return new nodes.ExportAllDeclaration(
      line,
      column,
      start,
      end,
      raw,
      source
    );
  } else {
    throw new UnsupportedNodeError(node);
  }
}

function mapSource(
  context: ParseContext,
  coffeeSource: StringLiteral
): nodes.String {
  const source = mapLiteral(context, coffeeSource);
  if (!(source instanceof nodes.String)) {
    throw new Error('Expected string literal as import source.');
  }
  return source;
}

function mapIdentifierSpecifier(
  context: ParseContext,
  specifier: CoffeeModuleSpecifier
): nodes.Identifier {
  if (specifier.alias) {
    throw new Error('Expected no alias for identifier specifier.');
  }
  return mapLiteralToIdentifier(context, specifier.original);
}

function mapStarSpecifier(
  context: ParseContext,
  specifier: CoffeeModuleSpecifier
): nodes.Identifier {
  if (specifier.original.value !== '*') {
    throw new Error('Expected a star on the LHS of a star specifier.');
  }
  if (!specifier.alias) {
    throw new Error('Expected node on the RHS of star specifier.');
  }
  return mapLiteralToIdentifier(context, specifier.alias);
}

function mapSpecifier(
  context: ParseContext,
  specifier: CoffeeModuleSpecifier
): nodes.ModuleSpecifier {
  const { line, column, start, end, raw } = getLocation(context, specifier);
  const original = mapLiteralToIdentifier(context, specifier.original);
  const alias = specifier.alias
    ? mapLiteralToIdentifier(context, specifier.alias)
    : null;
  return new nodes.ModuleSpecifier(
    line,
    column,
    start,
    end,
    raw,
    original,
    alias
  );
}

function mapLiteralToIdentifier(
  context: ParseContext,
  literal: Literal
): nodes.Identifier {
  if (literal instanceof IdentifierLiteral) {
    return mapLiteral(context, literal) as nodes.Identifier;
  } else if (literal.constructor === Literal) {
    const { line, column, start, end, raw } = getLocation(context, literal);
    return new nodes.Identifier(line, column, start, end, raw, literal.value);
  } else {
    throw new Error('Expected identifier in module declaration.');
  }
}
