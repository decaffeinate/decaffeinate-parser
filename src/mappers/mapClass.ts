import { Class as CoffeeClass } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { Class } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapClass(context: ParseContext, node: CoffeeClass): Class {
  const { line, column, start, end, raw } = getLocation(context, node);

  const nameAssignee = node.variable ? mapAny(context, node.variable) : null;
  const parent = node.parent ? mapAny(context, node.parent) : null;

  const childContext = context.updateState(s => s.pushCurrentClass());
  const body = mapPossiblyEmptyBlock(childContext, node.body);
  const boundMethods = childContext.parseState.currentClassBoundMethods;
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
