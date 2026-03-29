import type { SimConfig } from './config';
import type { WorldState, GrassCell, Deer, Wolf } from './simulation/world';

export type MapConfig = {
  version: 1;
  config: SimConfig;
  grass: string;
  deer: Array<{ x: number; y: number }>;
  wolves: Array<{ x: number; y: number }>;
};

export function serializeMap(config: SimConfig, world: WorldState): string {
  const mapConfig: MapConfig = {
    version: 1,
    config: structuredClone(config),
    grass: encodeGrassBitfield(world.grass),
    deer: world.deer.map(d => ({ x: round2(d.x), y: round2(d.y) })),
    wolves: world.wolves.map(w => ({ x: round2(w.x), y: round2(w.y) })),
  };
  return JSON.stringify(mapConfig);
}

export function deserializeMap(json: string): { config: SimConfig; world: WorldState } {
  const parsed: MapConfig = JSON.parse(json);

  if (parsed.version !== 1) {
    throw new Error(`Unsupported map config version: ${parsed.version}`);
  }

  const config = parsed.config;
  const cols = config.map.width / config.map.cellSize;
  const rows = config.map.height / config.map.cellSize;
  const grass = decodeGrassBitfield(parsed.grass, cols, rows, config.grass.maxLevel);

  let nextId = 0;

  const deer: Deer[] = parsed.deer.map(d => ({
    id: nextId++,
    kind: 'deer' as const,
    x: d.x,
    y: d.y,
    energy: 50,
    heading: 0,
    mode: 'wander' as const,
    reproductionCooldown: 0,
  }));

  const wolves: Wolf[] = parsed.wolves.map(w => ({
    id: nextId++,
    kind: 'wolf' as const,
    x: w.x,
    y: w.y,
    energy: 50,
    heading: 0,
    mode: 'wander' as const,
    reproductionCooldown: 0,
  }));

  const world: WorldState = {
    grass,
    deer,
    wolves,
    tick: 0,
    populationHistory: [],
    nextId,
  };

  return { config, world };
}

function encodeGrassBitfield(grass: GrassCell[][]): string {
  const cols = grass.length;
  const rows = grass[0].length;
  const totalCells = cols * rows;
  const bytes = new Uint8Array(Math.ceil(totalCells / 8));

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const idx = col * rows + row;
      if (grass[col][row].level > 0) {
        bytes[idx >> 3] |= 1 << (idx & 7);
      }
    }
  }

  // Uint8Array → base64
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function decodeGrassBitfield(
  encoded: string,
  cols: number,
  rows: number,
  maxLevel: number,
): GrassCell[][] {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const grass: GrassCell[][] = [];
  for (let col = 0; col < cols; col++) {
    grass[col] = [];
    for (let row = 0; row < rows; row++) {
      const idx = col * rows + row;
      const hasGrass = (bytes[idx >> 3] & (1 << (idx & 7))) !== 0;
      grass[col][row] = {
        level: hasGrass ? maxLevel * 0.5 : 0,
        maxLevel,
      };
    }
  }

  return grass;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
