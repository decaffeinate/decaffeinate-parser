import { Class as CoffeeClass } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Class } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapClass(context: ParseContext, node: CoffeeClass): Class {
  let { line, column, start, end, raw } = getLocation(context, node);

  let nameAssignee = node.variable ? mapAny(context, node.variable) : null;
  let parent = node.parent ? mapAny(context, node.parent) : null;

  let childContext = context.updateState(s => s.pushCurrentClass());
  let body = mapPossiblyEmptyBlock(childContext, node.body);
  let boundMethods = childContext.parseState.currentClassBoundMethods;
  if (!boundMethods) {
    throw new Error('Expected a non-null bound method name array.');
  }

  return new Class(
    line, column, start, end, raw,
    nameAssignee,
    nameAssignee,
    body,
    boundMethods,
    parent,
    childContext.parseState.currentClassCtor
  );
}
