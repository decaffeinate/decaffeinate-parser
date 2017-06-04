import lex from 'coffee-lex';
import * as CoffeeScript from 'decaffeinate-coffeescript';
import { patchCoffeeScript } from './ext/coffee-script';
import mapProgram from './mappers/mapProgram';
import { Program } from './nodes';
import fixLocations from './util/fixLocations';
import ParseContext from './util/ParseContext';

export function parse(source: string): Program {
  patchCoffeeScript();
  let context = ParseContext.fromSource(source, lex, CoffeeScript.nodes);
  fixLocations(context, context.ast);
  return mapProgram(context);
}
