import { nodes } from 'decaffeinate-coffeescript2';
import { Block } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes.js';

export default function parseCS2(source: string): Block {
  return nodes(source);
}
