import { Program } from '../nodes';
import ParseContext from '../util/ParseContext';
import mapPossiblyEmptyBlock from './mapPossiblyEmptyBlock';

export default function mapProgram(context: ParseContext): Program {
  return new Program(
    1,
    1,
    0,
    context.source.length,
    context.source,
    mapPossiblyEmptyBlock(context, context.ast),
    context
  );
}
