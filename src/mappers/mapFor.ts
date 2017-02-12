import { For as CoffeeFor } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { For, ForIn, ForOf } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapBase from './mapBase';
import mapBlock from './mapBlock';

export default function mapFor(context: ParseContext, node: CoffeeFor): For {
  let { line, column, start, end, raw } = mapBase(context, node);

  let keyAssignee = node.index ? mapAny(context, node.index) : null;
  let valAssignee = node.name ? mapAny(context, node.name) : null;
  let body = mapBlock(context, node.body);
  let target = mapAny(context, node.source);
  let filter = node.guard ? mapAny(context, node.guard) : null;

  if (node.object) {
    let isOwn = node.own;

    return new ForOf(
      line, column, start, end, raw,
      keyAssignee,
      valAssignee,
      target,
      filter,
      body,
      isOwn
    );
  } else {
    let step = node.step ? mapAny(context, node.step) : null;

    return new ForIn(
      line, column, start, end, raw,
      keyAssignee,
      valAssignee,
      target,
      filter,
      body,
      step
    );
  }
}