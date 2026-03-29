import type { SimConfig } from '../config';
import type { PRNG } from './prng';
import type { WorldState, Deer, Wolf, Actor, DeerMode, WolfMode } from './world';
import { flee } from './behaviors/flee';
import { graze } from './behaviors/graze';
import { hunt, type HuntResult } from './behaviors/hunt';
import { reproduce, type ReproduceResult } from './behaviors/reproduce';
import { wander } from './behaviors/wander';

type BehaviorResult = {
  desiredHeading: number;
  grazed: boolean;
  killedDeer: Deer | null;
  partner: Actor | null;
  drainMultiplier: number;
};

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function normalizeAngle(a: number): number {
  a = a % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function resolveHeading(current: number, desired: number, prng: PRNG): number {
  const momentum = 0.85;
  const noise = (prng() - 0.5) * 0.3;
  // Blend using the shortest angular difference
  let diff = normalizeAngle(desired - current);
  return normalizeAngle(current + diff * (1 - momentum) + noise);
}

function effectiveSpeed(actor: Actor, grassLevel: number, config: SimConfig): number {
  const speed = actor.kind === 'deer' ? config.deer.speed : config.wolf.speed;
  if (actor.kind === 'wolf' && grassLevel > config.wolf.grassSlowThreshold) {
    const t = (grassLevel - config.wolf.grassSlowThreshold) /
      (config.grass.maxLevel - config.wolf.grassSlowThreshold);
    return speed * (1 - t * (1 - config.wolf.grassSlowFactor));
  }
  return speed;
}

function resolveDeerMode(deer: Deer, wolves: Wolf[], config: SimConfig): DeerMode {
  // 1. Flee — any wolf within fearRadius
  const fearR2 = config.deer.fearRadius * config.deer.fearRadius;
  for (const w of wolves) {
    if (dist2(deer, w) < fearR2) return 'flee';
  }
  // 2. Graze
  if (deer.energy < config.deer.startGrazeLevel) return 'graze';
  if (deer.mode === 'graze' && deer.energy < config.deer.stopGrazeLevel) return 'graze';
  // 3. Reproduce
  if (deer.energy > config.deer.reproduceThreshold && deer.reproductionCooldown === 0) return 'reproduce';
  // 4. Wander
  return 'wander';
}

function resolveWolfMode(wolf: Wolf, config: SimConfig): WolfMode {
  // 1. Hunt
  if (wolf.energy < config.wolf.startHuntLevel) return 'hunt';
  if (wolf.mode === 'hunt' && wolf.energy < config.wolf.stopHuntLevel) return 'hunt';
  // 2. Reproduce
  if (wolf.energy > config.wolf.reproduceThreshold && wolf.reproductionCooldown === 0) return 'reproduce';
  // 3. Wander
  return 'wander';
}

function getGrassLevel(world: WorldState, x: number, y: number, config: SimConfig): number {
  const col = Math.floor(x / config.map.cellSize);
  const row = Math.floor(y / config.map.cellSize);
  const cols = config.map.width / config.map.cellSize;
  const rows = config.map.height / config.map.cellSize;
  const c = clamp(col, 0, cols - 1);
  const r = clamp(row, 0, rows - 1);
  return world.grass[c][r].level;
}

function actorsInRadius<T extends Actor>(actor: Actor, list: T[], radius: number): T[] {
  const r2 = radius * radius;
  const result: T[] = [];
  for (const other of list) {
    if (other.id === actor.id) continue;
    if (dist2(actor, other) < r2) result.push(other);
  }
  return result;
}

export function tick(world: WorldState, config: SimConfig, prng: PRNG): void {
  const cols = config.map.width / config.map.cellSize;
  const rows = config.map.height / config.map.cellSize;
  const mapW = config.map.width;
  const mapH = config.map.height;

  // Step 1: Grow grass
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const cell = world.grass[col][row];
      if (cell.level > 0 && cell.level < cell.maxLevel) {
        cell.level = Math.min(cell.level + config.grass.growthRatePerTick, cell.maxLevel);
      }
    }
  }

  // Step 2: Resolve modes
  for (const deer of world.deer) {
    deer.mode = resolveDeerMode(deer, world.wolves, config);
  }
  for (const wolf of world.wolves) {
    wolf.mode = resolveWolfMode(wolf, config);
  }

  // Step 3: Compute desired headings (read-only phase)
  const results = new Map<number, BehaviorResult>();

  for (const deer of world.deer) {
    let result: BehaviorResult = {
      desiredHeading: deer.heading,
      grazed: false,
      killedDeer: null,
      partner: null,
      drainMultiplier: 1.0,
    };

    switch (deer.mode) {
      case 'flee': {
        const nearbyWolves = actorsInRadius(deer, world.wolves, config.deer.fearRadius);
        result.desiredHeading = flee(deer, nearbyWolves);
        result.drainMultiplier = config.deer.fleeDrainMultiplier;
        break;
      }
      case 'graze': {
        const gr = graze(deer, world.grass, config);
        result.desiredHeading = gr.desiredHeading;
        result.grazed = gr.grazed;
        break;
      }
      case 'reproduce': {
        const peers = actorsInRadius(deer, world.deer, config.deer.viewRadius);
        const rr: ReproduceResult = reproduce(deer, peers, config.deer.viewRadius, config.deer.reproduceRadius);
        result.desiredHeading = rr.desiredHeading;
        result.partner = rr.partner;
        break;
      }
      case 'wander': {
        const peers = actorsInRadius(deer, world.deer, config.deer.viewRadius);
        result.desiredHeading = wander(deer, peers, config.deer.flockThreshold, prng);
        break;
      }
    }

    results.set(deer.id, result);
  }

  for (const wolf of world.wolves) {
    let result: BehaviorResult = {
      desiredHeading: wolf.heading,
      grazed: false,
      killedDeer: null,
      partner: null,
      drainMultiplier: 1.0,
    };

    switch (wolf.mode) {
      case 'hunt': {
        const nearbyDeer = actorsInRadius(wolf, world.deer, config.wolf.viewRadius);
        const hr: HuntResult = hunt(wolf, nearbyDeer, config.wolf.catchRadius);
        result.desiredHeading = hr.desiredHeading;
        result.killedDeer = hr.killedDeer;
        result.drainMultiplier = config.wolf.huntDrainMultiplier;
        break;
      }
      case 'reproduce': {
        const peers = actorsInRadius(wolf, world.wolves, config.wolf.viewRadius);
        const rr: ReproduceResult = reproduce(wolf, peers, config.wolf.viewRadius, config.wolf.reproduceRadius);
        result.desiredHeading = rr.desiredHeading;
        result.partner = rr.partner;
        break;
      }
      case 'wander': {
        const peers = actorsInRadius(wolf, world.wolves, config.wolf.viewRadius);
        result.desiredHeading = wander(wolf, peers, config.wolf.flockThreshold, prng);
        break;
      }
    }

    results.set(wolf.id, result);
  }

  // Step 4: Apply movement and energy
  const allActors: Actor[] = [...world.deer, ...world.wolves];
  for (const actor of allActors) {
    const br = results.get(actor.id)!;
    const grassLevel = getGrassLevel(world, actor.x, actor.y, config);
    const speed = effectiveSpeed(actor, grassLevel, config);

    actor.heading = resolveHeading(actor.heading, br.desiredHeading, prng);
    const nx = actor.x + Math.cos(actor.heading) * speed;
    const ny = actor.y + Math.sin(actor.heading) * speed;

    // Reflect heading off boundaries
    if (nx <= 0 || nx >= mapW) {
      actor.heading = normalizeAngle(Math.PI - actor.heading);
    }
    if (ny <= 0 || ny >= mapH) {
      actor.heading = normalizeAngle(-actor.heading);
    }

    actor.x = clamp(nx, 0, mapW);
    actor.y = clamp(ny, 0, mapH);

    const acfg = actor.kind === 'deer' ? config.deer : config.wolf;
    const movementDrain = speed * acfg.movementDrainMultiplier * br.drainMultiplier;
    let energyDelta = -acfg.passiveDrainPerTick - movementDrain;

    if (actor.kind === 'deer' && br.grazed) {
      energyDelta += config.deer.grazeEnergyGain;
    }

    actor.energy = clamp(actor.energy + energyDelta, 0, 100);
  }

  // Step 5a: Wolf kills
  const killedIds = new Set<number>();
  for (const wolf of world.wolves) {
    const br = results.get(wolf.id)!;
    if (br.killedDeer && !killedIds.has(br.killedDeer.id)) {
      killedIds.add(br.killedDeer.id);
      wolf.energy = clamp(wolf.energy + config.wolf.huntEnergyGain, 0, 100);
    }
  }
  world.deer = world.deer.filter(d => !killedIds.has(d.id));

  // Step 5b: Reproduction
  const processedPairs = new Set<string>();

  // Deer reproduction (snapshot length to avoid iterating newborns)
  const deerCount = world.deer.length;
  for (let di = 0; di < deerCount; di++) {
    const deer = world.deer[di];
    const br = results.get(deer.id);
    if (!br || !br.partner || br.partner.kind !== 'deer') continue;
    if (world.deer.length >= config.deer.maxCount) break;

    const pairKey = Math.min(deer.id, br.partner.id) + ':' + Math.max(deer.id, br.partner.id);
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    const partner = world.deer.find(d => d.id === br.partner!.id);
    if (!partner) continue;

    deer.energy -= config.deer.reproduceDrain;
    partner.energy -= config.deer.reproduceDrain;
    deer.reproductionCooldown = config.deer.reproductionCooldownTicks;
    partner.reproductionCooldown = config.deer.reproductionCooldownTicks;

    const ox = (prng() - 0.5) * 10;
    const oy = (prng() - 0.5) * 10;
    world.deer.push({
      id: world.nextId++,
      kind: 'deer',
      x: clamp((deer.x + partner.x) / 2 + ox, 0, mapW),
      y: clamp((deer.y + partner.y) / 2 + oy, 0, mapH),
      energy: 50,
      heading: prng() * Math.PI * 2,
      mode: 'wander',
      reproductionCooldown: 0,
    });
  }

  // Wolf reproduction (snapshot length to avoid iterating newborns)
  const wolfCount = world.wolves.length;
  for (let wi = 0; wi < wolfCount; wi++) {
    const wolf = world.wolves[wi];
    const br = results.get(wolf.id);
    if (!br || !br.partner || br.partner.kind !== 'wolf') continue;
    if (world.wolves.length >= config.wolf.maxCount) break;

    const pairKey = Math.min(wolf.id, br.partner.id) + ':' + Math.max(wolf.id, br.partner.id);
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    const partner = world.wolves.find(w => w.id === br.partner!.id);
    if (!partner) continue;

    wolf.energy -= config.wolf.reproduceDrain;
    partner.energy -= config.wolf.reproduceDrain;
    wolf.reproductionCooldown = config.wolf.reproductionCooldownTicks;
    partner.reproductionCooldown = config.wolf.reproductionCooldownTicks;

    const ox = (prng() - 0.5) * 10;
    const oy = (prng() - 0.5) * 10;
    world.wolves.push({
      id: world.nextId++,
      kind: 'wolf',
      x: clamp((wolf.x + partner.x) / 2 + ox, 0, mapW),
      y: clamp((wolf.y + partner.y) / 2 + oy, 0, mapH),
      energy: 50,
      heading: prng() * Math.PI * 2,
      mode: 'wander',
      reproductionCooldown: 0,
    });
  }

  // Step 6: Remove dead actors
  world.deer = world.deer.filter(d => d.energy > 0);
  world.wolves = world.wolves.filter(w => w.energy > 0);

  // Step 7: Decrement reproduction cooldowns
  for (const deer of world.deer) {
    if (deer.reproductionCooldown > 0) deer.reproductionCooldown--;
  }
  for (const wolf of world.wolves) {
    if (wolf.reproductionCooldown > 0) wolf.reproductionCooldown--;
  }

  // Step 8: Record population snapshot
  let grassCoverage = 0;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (world.grass[col][row].level > 0) grassCoverage++;
    }
  }

  world.tick++;
  world.populationHistory.push({
    tick: world.tick,
    deer: world.deer.length,
    wolves: world.wolves.length,
    grassCoverage: grassCoverage / (cols * rows),
  });
}
