import { Code } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { BaseFunction, BoundFunction, BoundGeneratorFunction, Function, GeneratorFunction } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapCode(context: ParseContext, node: Code): BaseFunction {
  let { line, column, start, end, raw } = getLocation(context, node);

  let Node = getNodeTypeForCode(node);

  let childContext = context.updateState(s => s.dropCurrentClass());

  return new Node(
    line, column, start, end, raw,
    node.params.map(param => mapAny(childContext, param)),
    mapPossiblyEmptyBlock(childContext, node.body)
  );
}

function getNodeTypeForCode(node: Code): typeof BoundFunction | typeof BoundGeneratorFunction | typeof GeneratorFunction | typeof Function {
  if (node.isGenerator) {
    if (node.bound) {
      return BoundGeneratorFunction;
    } else {
      return GeneratorFunction;
    }
  } else {
    if (node.bound) {
      return BoundFunction;
    } else {
      return Function;
    }
  }
}
