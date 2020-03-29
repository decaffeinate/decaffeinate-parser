import { Code } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import {
  AsyncFunction,
  BaseFunction,
  BoundAsyncFunction,
  BoundFunction,
  BoundGeneratorFunction,
  Function,
  GeneratorFunction,
} from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapCode(
  context: ParseContext,
  node: Code
): BaseFunction {
  const { line, column, start, end, raw } = getLocation(context, node);

  const Node = getNodeTypeForCode(node);

  const childContext = context.updateState((s) => s.dropCurrentClass());

  return new Node(
    line,
    column,
    start,
    end,
    raw,
    node.params.map((param) => mapAny(childContext, param)),
    mapPossiblyEmptyBlock(childContext, node.body)
  );
}

function getNodeTypeForCode(
  node: Code
):
  | typeof BoundFunction
  | typeof BoundGeneratorFunction
  | typeof AsyncFunction
  | typeof BoundAsyncFunction
  | typeof GeneratorFunction
  | typeof Function {
  if (node.isGenerator) {
    if (node.bound) {
      return BoundGeneratorFunction;
    } else {
      return GeneratorFunction;
    }
  } else if (node.isAsync) {
    if (node.bound) {
      return BoundAsyncFunction;
    } else {
      return AsyncFunction;
    }
  } else {
    if (node.bound) {
      return BoundFunction;
    } else {
      return Function;
    }
  }
}
