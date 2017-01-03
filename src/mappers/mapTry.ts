import { Try as CoffeeTry } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Try } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';

export default function mapTry(context: ParseContext, node: CoffeeTry): Try {
  let { line, column, start, end, raw, virtual } = mapBase(context, node);

  return new Try(
    line, column, start, end, raw, virtual,
    node.attempt ? mapAny(context, node.attempt) : null,
    node.errorVariable ? mapAny(context, node.errorVariable) : null,
    node.recovery ? mapAny(context, node.recovery) : null,
    node.ensure ? mapAny(context, node.ensure) : null
  );
}
