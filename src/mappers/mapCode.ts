import { Code } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { BaseFunction, BoundFunction, BoundGeneratorFunction, Function, GeneratorFunction } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';
import mapBlock from './mapBlock';

export default function mapCode(context: ParseContext, node: Code): BaseFunction {
  let { line, column, start, end, raw } = mapBase(context, node);

  let Node = getNodeTypeForCode(node);

  return new Node(
    line, column, start, end, raw,
    node.params.map(param => mapAny(context, param)),
    mapBlock(context, node.body)
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
