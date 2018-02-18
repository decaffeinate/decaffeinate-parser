import {
  ExportAllDeclaration as CoffeeExportAllDeclaration,
  ExportDefaultDeclaration as CoffeeExportDefaultDeclaration,
  ExportNamedDeclaration as CoffeeExportNamedDeclaration, ExportSpecifierList,
  ImportClause,
  ImportDeclaration as CoffeeImportDeclaration,
  ImportNamespaceSpecifier,
  ImportSpecifierList,
  Literal,
  ModuleDeclaration,
  ModuleSpecifier as CoffeeModuleSpecifier, StringLiteral,
} from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import {
  ExportAllDeclaration,
  ExportBindingsDeclaration, ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Identifier,
  ImportDeclaration,
  ModuleSpecifier,
  Node,
  String,
} from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import UnsupportedNodeError from '../util/UnsupportedNodeError';
import mapAny from './mapAny';
import mapLiteral from './mapLiteral';

export default function mapModuleDeclaration(context: ParseContext, node: ModuleDeclaration): Node {
  let { line, column, start, end, raw } = getLocation(context, node);

  if (node instanceof CoffeeImportDeclaration) {
    let clause = node.clause;
    if (!(clause instanceof ImportClause)) {
      throw new Error('Expected import clause as the clause for an import declaration.');
    }
    let defaultBinding = clause.defaultBinding && mapIdentifierSpecifier(context, clause.defaultBinding);
    let namespaceImport = null;
    let namedImports = null;

    if (clause.namedImports instanceof ImportNamespaceSpecifier) {
      namespaceImport = mapStarSpecifier(context, clause.namedImports);
    } else if (clause.namedImports instanceof ImportSpecifierList) {
      namedImports = clause.namedImports.specifiers.map((specifier) => mapSpecifier(context, specifier));
    }

    if (!node.source) {
      throw new Error('Expected non-null source for import.');
    }
    let source = mapSource(context, node.source);
    return new ImportDeclaration(line, column, start, end, raw, defaultBinding, namespaceImport, namedImports, source);
  } else if (node instanceof CoffeeExportNamedDeclaration) {
    if (node.clause instanceof ExportSpecifierList) {
      let namedExports = node.clause.specifiers.map((specifier) => mapSpecifier(context, specifier));
      let source = node.source ? mapSource(context, node.source) : null;
      return new ExportBindingsDeclaration(line, column, start, end, raw, namedExports, source);
    } else {
      let expression = mapAny(context, node.clause);
      return new ExportNamedDeclaration(line, column, start, end, raw, expression);
    }
  } else if (node instanceof CoffeeExportDefaultDeclaration) {
    let expression = mapAny(context, node.clause);
    return new ExportDefaultDeclaration(line, column, start, end, raw, expression);
  } else if (node instanceof CoffeeExportAllDeclaration) {
    if (!node.source) {
      throw new Error('Expected non-null source for star export.');
    }
    let source = mapSource(context, node.source);
    return new ExportAllDeclaration(line, column, start, end, raw, source);
  } else {
    throw new UnsupportedNodeError(node);
  }
}

function mapSource(context: ParseContext, coffeeSource: StringLiteral): String {
  let source = mapLiteral(context, coffeeSource);
  if (!(source instanceof String)) {
    throw new Error('Expected string literal as import source.');
  }
  return source;
}

function mapIdentifierSpecifier(context: ParseContext, specifier: CoffeeModuleSpecifier): Identifier {
  if (specifier.alias) {
    throw new Error('Expected no alias for identifier specifier.');
  }
  return mapLiteralToIdentifier(context, specifier.original);
}

function mapStarSpecifier(context: ParseContext, specifier: CoffeeModuleSpecifier): Identifier {
  if (specifier.original.value !== '*') {
    throw new Error('Expected a star on the LHS of a star specifier.');
  }
  if (!specifier.alias) {
    throw new Error('Expected node on the RHS of star specifier.');
  }
  return mapLiteralToIdentifier(context, specifier.alias);
}

function mapSpecifier(context: ParseContext, specifier: CoffeeModuleSpecifier): ModuleSpecifier {
  let { line, column, start, end, raw } = getLocation(context, specifier);
  let original = mapLiteralToIdentifier(context, specifier.original);
  let alias = specifier.alias ? mapLiteralToIdentifier(context, specifier.alias) : null;
  return new ModuleSpecifier(line, column, start, end, raw, original, alias);
}

function mapLiteralToIdentifier(context: ParseContext, literal: Literal): Identifier {
  let identifier = mapLiteral(context, literal);
  if (!(identifier instanceof Identifier)) {
    throw new Error('Expected identifier in declaration.');
  }
  return identifier;
}
