import { Assign, Class as CoffeeClass, Comment, Obj, Value } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { inspect } from 'util';
import {
  AssignOp, Block, BoundFunction, BoundGeneratorFunction, Class, ClassProtoAssignOp, Constructor, Function,
  Identifier, MemberAccessOp, Node, This
} from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapClass(context: ParseContext, node: CoffeeClass): Class {
  let { line, column, start, end, raw } = mapBase(context, node);

  let body: Block | null = null;
  let ctor: Constructor | null = null;
  let boundMethods: Array<ClassProtoAssignOp> = [];

  if (node.body && node.body.expressions.length > 0) {
    let statements: Array<Node> = [];

    for (let expression of node.body.expressions) {
      if (expression instanceof Value && expression.base instanceof Obj) {
        for (let property of expression.base.properties) {
          if (property instanceof Comment) {
            continue;
          } else if (property instanceof Assign) {
            let { line, column, start, end, raw } = mapBase(context, property);
            let key = mapAny(context, property.variable);
            let value = mapAny(context, property.value);
            let Node = ClassProtoAssignOp;

            if (key instanceof Identifier && key.data === 'constructor' && value instanceof Function) {
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

            if (assignment instanceof ClassProtoAssignOp && (assignment.expression instanceof BoundFunction || assignment.expression instanceof BoundGeneratorFunction)) {
              boundMethods.push(assignment);
            }

            if (assignment instanceof Constructor) {
              ctor = assignment;
            }
          } else {
            throw new Error(`unexpected class assignment: ${inspect(property)}`);
          }
        }
      } else {
        statements.push(mapAny(context, expression));
      }
    }

    if (statements.length > 0) {
      let firstStatement = statements[0];
      let lastStatement = statements[statements.length - 1];

      body = new Block(
        firstStatement.line,
        firstStatement.column,
        firstStatement.start,
        lastStatement.end,
        context.source.slice(firstStatement.start, lastStatement.end),
        statements,
        false
      );
    }
  }

  let nameAssignee = node.variable ? mapAny(context, node.variable) : null;
  let parent = node.parent ? mapAny(context, node.parent) : null;

  return new Class(
    line, column, start, end, raw,
    nameAssignee,
    nameAssignee,
    body,
    boundMethods,
    parent,
    ctor
  );
}
