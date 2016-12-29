import { Base, LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import mergeLocations from './mergeLocations';

export default function locationContainingNodes(...nodes: Array<Base>): LocationData | null {
  switch (nodes.length) {
    case 0:
      return null;

    case 1:
      return nodes[0].locationData;

    case 2:
      return mergeLocations(nodes[0].locationData, nodes[1].locationData);

    default:
      // NOTE: force-cast since `nodes.slice(1)` cannot return `null` here.
      let tail = locationContainingNodes(...nodes.slice(1)) as LocationData;
      return mergeLocations(nodes[0].locationData, tail);
  }
}
