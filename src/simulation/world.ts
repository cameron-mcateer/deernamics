import type { PRNG } from './prng';
import type { SimConfig } from '../config';

export type GrassCell = {
  level: number;
  maxLevel: number;
};

export type DeerMode = 'flee' | 'graze' | 'reproduce' | 'wander';
export type WolfMode = 'hunt' | 'reproduce' | 'wander';

export type ActorBase = {
  id: number;
  x: number;
  y: number;
  energy: number;
  heading: number;
  reproductionCooldown: number;
};

export type Deer = ActorBase & { kind: 'deer'; mode: DeerMode };
export type Wolf = ActorBase & { kind: 'wolf'; mode: WolfMode };
export type Actor = Deer | Wolf;

export type PopulationSnapshot = {
  tick: number;
  deer: number;
  wolves: number;
  grassCoverage: number;
};

export type WorldState = {
  grass: GrassCell[][];
  deer: Deer[];
  wolves: Wolf[];
  tick: number;
  populationHistory: PopulationSnapshot[];
  nextId: number;
};

export function createWorld(config: SimConfig, prng: PRNG): WorldState {
  const cols = config.map.width / config.map.cellSize;
  const rows = config.map.height / config.map.cellSize;

  // Initialize grass grid — cells start at 50% maxLevel for export round-trip consistency
  const grass: GrassCell[][] = [];
  for (let col = 0; col < cols; col++) {
    grass[col] = [];
    for (let row = 0; row < rows; row++) {
      const hasGrass = prng() < 0.3;
      grass[col][row] = {
        level: hasGrass ? config.grass.maxLevel * 0.5 : 0,
        maxLevel: config.grass.maxLevel,
      };
    }
  }

  let nextId = 0;

  // Place initial deer
  const deer: Deer[] = [];
  for (let i = 0; i < config.deer.initialCount; i++) {
    deer.push({
      id: nextId++,
      kind: 'deer',
      x: prng() * config.map.width,
      y: prng() * config.map.height,
      energy: 50,
      heading: prng() * Math.PI * 2,
      mode: 'wander',
      reproductionCooldown: 0,
    });
  }

  // Place initial wolves
  const wolves: Wolf[] = [];
  for (let i = 0; i < config.wolf.initialCount; i++) {
    wolves.push({
      id: nextId++,
      kind: 'wolf',
      x: prng() * config.map.width,
      y: prng() * config.map.height,
      energy: 50,
      heading: prng() * Math.PI * 2,
      mode: 'wander',
      reproductionCooldown: 0,
    });
  }

  return {
    grass,
    deer,
    wolves,
    tick: 0,
    populationHistory: [],
    nextId,
  };
}

export function resetWorld(
  existing: WorldState,
  config: SimConfig,
  prng: PRNG,
): WorldState {
  const cols = config.map.width / config.map.cellSize;
  const rows = config.map.height / config.map.cellSize;

  // Re-initialize grass grid
  const grass: GrassCell[][] = [];
  for (let col = 0; col < cols; col++) {
    grass[col] = [];
    for (let row = 0; row < rows; row++) {
      const hasGrass = prng() < 0.3;
      grass[col][row] = {
        level: hasGrass ? config.grass.maxLevel * 0.5 : 0,
        maxLevel: config.grass.maxLevel,
      };
    }
  }

  let nextId = 0;

  // Preserve existing deer count, reset positions
  const deer: Deer[] = [];
  for (let i = 0; i < existing.deer.length; i++) {
    deer.push({
      id: nextId++,
      kind: 'deer',
      x: prng() * config.map.width,
      y: prng() * config.map.height,
      energy: 50,
      heading: prng() * Math.PI * 2,
      mode: 'wander',
      reproductionCooldown: 0,
    });
  }

  // Preserve existing wolf count, reset positions
  const wolves: Wolf[] = [];
  for (let i = 0; i < existing.wolves.length; i++) {
    wolves.push({
      id: nextId++,
      kind: 'wolf',
      x: prng() * config.map.width,
      y: prng() * config.map.height,
      energy: 50,
      heading: prng() * Math.PI * 2,
      mode: 'wander',
      reproductionCooldown: 0,
    });
  }

  return {
    grass,
    deer,
    wolves,
    tick: 0,
    populationHistory: [],
    nextId,
  };
}
