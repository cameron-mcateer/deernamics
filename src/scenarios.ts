import { deserializeMap } from './serialization';
import type { SimConfig } from './config';
import type { WorldState } from './simulation/world';

import deerOverpopulateJson from '../deernamics-deer-overpopulate.json?raw';
import wolvesEatAllDeerJson from '../deernamics-wolves-eat-all-deer.json?raw';
import deerFollowWolfGrassJson from '../deernamics-deer-follow-wolf-grass.json?raw';

export type Scenario = {
  id: string;
  name: string;
  description: string;
  json: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'deer-overpopulate',
    name: 'Deer Overpopulation',
    description: 'Deer overrun the map and kill the grass, eventually dying of starvation from unmitigated growth.',
    json: deerOverpopulateJson,
  },
  {
    id: 'wolves-eat-all-deer',
    name: 'Wolf Overhunting',
    description: 'Wolves over-hunt the deer population and eventually starve themselves out.',
    json: wolvesEatAllDeerJson,
  },
  {
    id: 'deer-follow-wolf-grass',
    name: 'Wolf Trail Grazing',
    description: 'Grass decays naturally but wolves seed it along their paths. Deer must balance fleeing wolves with following their grassy routes to survive.',
    json: deerFollowWolfGrassJson,
  },
];

export function loadScenario(scenario: Scenario): { config: SimConfig; world: WorldState } {
  return deserializeMap(scenario.json);
}
