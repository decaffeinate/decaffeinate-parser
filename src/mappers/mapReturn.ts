import { Return as CoffeeReturn, YieldReturn as CoffeeYieldReturn } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import {Return, YieldReturn} from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';

export default function mapReturn(context: ParseContext, node: CoffeeReturn): Return {
  let { line, column, start, end, raw } = getLocation(context, node);
  let argument = node.expression ? mapAny(context, node.expression) : null;
  if (node instanceof CoffeeYieldReturn) {
    return new YieldReturn(line, column, start, end, raw, argument);
  } else {
    return new Return(line, column, start, end, raw, argument);
  }
}
