import { For as CoffeeFor } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { For, ForFrom, ForIn, ForOf } from '../nodes';
import getLocation from '../util/getLocation';
import ParseContext from '../util/ParseContext';
import mapAny from './mapAny';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapFor(context: ParseContext, node: CoffeeFor): For {
  const { line, column, start, end, raw } = getLocation(context, node);

  const keyAssignee = node.index ? mapAny(context, node.index) : null;
  const valAssignee = node.name ? mapAny(context, node.name) : null;
  let body = mapPossiblyEmptyBlock(context, node.body);
  const target = mapAny(context, node.source);
  const filter = node.guard ? mapAny(context, node.guard) : null;

  if (body && body.start < target.start) {
    body = body.withInline(true);
  }

  if (node.object) {
    const isOwn = node.own;

    return new ForOf(
      line,
      column,
      start,
      end,
      raw,
      keyAssignee,
      valAssignee,
      target,
      filter,
      body,
      isOwn
    );
  } else {
    if (node.from) {
      if (keyAssignee) {
        throw new Error('Unexpected key assignee in for...from.');
      }
      return new ForFrom(
        line,
        column,
        start,
        end,
        raw,
        valAssignee,
        target,
        filter,
        body
      );
    } else {
      const step = node.step ? mapAny(context, node.step) : null;
      return new ForIn(
        line,
        column,
        start,
        end,
        raw,
        keyAssignee,
        valAssignee,
        target,
        filter,
        body,
        step
      );
    }
  }
}
