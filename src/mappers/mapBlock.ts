import { SourceType } from 'coffee-lex';
import { Assign, Base, Block as CoffeeBlock, Obj, Value } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { inspect } from 'util';
import {
  AssignOp,
  Block,
  BoundAsyncFunction,
  BoundFunction,
  BoundGeneratorFunction,
  ClassProtoAssignOp,
  Constructor,
  Identifier,
  MemberAccessOp,
  Node,
  This,
} from '../nodes';
import getLocation from '../util/getLocation';
import isCommentOnlyNode from '../util/isCommentOnlyNode';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapBlock(context: ParseContext, node: CoffeeBlock): Block {
  let childContext = context;
  if (context.parseState.isInClassBody()) {
    // Replicate a bug in CoffeeScript: at any block where we see an
    // object-style proto assignment, stop considering proto assignments in any
    // sub-traversals. This is taken from the walkBody implementation.
    let hasProtoAssignChild = node.expressions.some(child =>
      child instanceof Value && child.isObject(true)
    );
    if (hasProtoAssignChild) {
      childContext = childContext.updateState(s => s.dropCurrentClass());
    }
  }

  let { line, column, start, end, raw } = getLocation(context, node);
  let previousTokenIndex = context.sourceTokens.indexOfTokenNearSourceIndex(start).previous();
  let previousToken = previousTokenIndex ? context.sourceTokens.tokenAtIndex(previousTokenIndex) : null;
  let inline = previousToken ? previousToken.type !== SourceType.NEWLINE : false;

  return new Block(
    line, column, start, end, raw,
    node.expressions
      .filter(expression => !isCommentOnlyNode(expression))
      .map(expression => mapChild(context, childContext, expression))
      .reduce((arr, current) => arr.concat(current), []),
    inline
  );
}

function mapChild(blockContext: ParseContext, childContext: ParseContext, node: Base): Array<Node> {
  if (blockContext.parseState.isInClassBody() && node instanceof Value && node.isObject(true)) {
    let obj = node.base;
    if (!(obj instanceof Obj)) {
      throw new Error('Expected isObject node to be an object.');
    }

    let statements: Array<Node> = [];
    for (let property of obj.properties) {
      if (isCommentOnlyNode(property)) {
        continue;
      }
      if (property instanceof Assign) {
        let { line, column, start, end, raw } = getLocation(childContext, property);
        let key = mapAny(childContext, property.variable);
        let value = mapAny(childContext, property.value);
        let Node = ClassProtoAssignOp;

        if (key instanceof Identifier && key.data === 'constructor') {
          Node = Constructor;
        } else if (key instanceof MemberAccessOp && key.expression instanceof This) {
          Node = AssignOp;
        }

        let assignment = new Node(
          line, column, start, end, raw,
          key,
          value
        );

        statements.push(assignment);

        if (assignment instanceof ClassProtoAssignOp &&
            (
              assignment.expression instanceof BoundFunction ||
              assignment.expression instanceof BoundGeneratorFunction ||
              assignment.expression instanceof BoundAsyncFunction
            )) {
          blockContext.parseState.recordBoundMethod(assignment);
        }

        if (assignment instanceof Constructor) {
          blockContext.parseState.recordConstructor(assignment);
        }
      } else {
        throw new Error(`unexpected class assignment: ${inspect(property)}`);
      }
    }
    return statements;
  }
  return [mapAny(childContext, node)];
}
