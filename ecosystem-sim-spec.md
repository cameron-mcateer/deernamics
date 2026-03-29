# Emergent Ecosystem Simulation -- Implementation Spec

## Overview

Build a browser-based predator-prey ecosystem simulation using Vite + TypeScript, rendered on an
HTML canvas. Users place actors (wolves, deer, grass) on a 2D map, configure behavioral parameters,
then observe emergent population dynamics. Deploy to GitHub Pages.

---

## 1. Project Setup

- Vite + TypeScript
- Yarn package manager
- Deploy target: GitHub Pages (configure vite.config.ts base path accordingly)
- No UI framework. Vanilla DOM for controls.
- No simulation/physics libraries. All logic hand-rolled.

Directory structure:

```
src/
  simulation/
    engine.ts
    prng.ts
    world.ts
    actors/
      deer.ts
      wolf.ts
      grass.ts
    behaviors/
      flee.ts
      graze.ts
      hunt.ts
      reproduce.ts
      wander.ts
  rendering/
    renderer.ts
    graph.ts
  ui/
    controls.ts
    placement.ts
  config.ts
  main.ts
```

---

## 2. PRNG

Use mulberry32 -- simple, seedable, no dependencies.

```ts
// src/simulation/prng.ts
export type PRNG = () => number; // returns float in [0, 1)

export function createPRNG(seed: number): PRNG {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Rules:
- The PRNG instance is created once at init with the configured seed.
- ALL randomness in the simulation (movement noise, spawn offsets, wander perturbation,
  initial placement) uses this single PRNG instance.
- On reset: recreate the PRNG from the same seed. The simulation must replay identically
  if config has not changed.
- The seed is exposed as a text input in the UI. Changes take effect on the next reset.

---

## 3. Map

| Property        | Value                                         |
|-----------------|-----------------------------------------------|
| Canvas size     | 800 x 800 px                                  |
| Cell size       | 10 px                                         |
| Grid dimensions | 80 x 80 = 6,400 cells                         |
| Coordinate type | Continuous float (x, y) for actors            |
| Cell lookup     | col = floor(x / 10), row = floor(y / 10)      |
| Bounds          | Actors clamped to [0, 800). No wrapping.      |

---

## 4. Data Model

```ts
// Grass: one entry per grid cell
type GrassCell = {
  level: number;     // 0 to maxLevel (float)
  maxLevel: number;
};

// Actor base
type ActorBase = {
  id: number;
  x: number;
  y: number;
  energy: number;            // float, 0-100
  heading: number;           // radians
  mode: DeerMode | WolfMode;
  reproductionCooldown: number; // ticks remaining before can reproduce again
};

type Deer = ActorBase & { kind: 'deer' };
type Wolf = ActorBase & { kind: 'wolf' };

type DeerMode = 'flee' | 'graze' | 'reproduce' | 'wander';
type WolfMode = 'hunt' | 'reproduce' | 'wander';

// World
type WorldState = {
  grass: GrassCell[][];  // indexed [col][row]
  deer: Deer[];
  wolves: Wolf[];
  tick: number;
  populationHistory: {
    tick: number;
    deer: number;
    wolves: number;
    grassCoverage: number; // fraction 0-1 of cells with level > 0
  }[];
};
```

---

## 5. Config

All values below are defaults. Every value must be exposed in the UI config panel.
Changes to config take effect on the next reset only.

```ts
// src/config.ts
export const DEFAULTS = {
  seed: 42,

  map: {
    width: 800,
    height: 800,
    cellSize: 10,
  },

  grass: {
    maxLevel: 100,
    growthRatePerTick: 0.5,      // added to each cell's level per tick (if below max)
  },

  deer: {
    maxCount: 500,
    initialCount: 40,
    speed: 1.5,                  // px per tick base speed
    passiveDrainPerTick: 0.05,   // energy lost per tick regardless of activity
    movementDrainMultiplier: 0.02, // additional energy lost per px moved
    fleeDrainMultiplier: 1.8,    // multiplies movement drain when in flee mode
    startGrazeLevel: 50,         // enter graze mode when energy drops below this
    stopGrazeLevel: 75,          // exit graze mode when energy rises above this
    grazeRate: 5,                // grass level consumed per tick while grazing
    grazeEnergyGain: 8,          // energy gained per tick while grazing (if grass > 0)
    fearRadius: 120,             // px -- wolves within this radius trigger flee
    viewRadius: 150,             // px -- radius for observing peers and grass
    flockThreshold: 3000,        // avg squared distance above this triggers flock bias
    reproduceThreshold: 85,      // energy must exceed this to enter reproduce mode
    reproduceDrain: 30,          // energy cost to each parent on reproduction
    reproduceRadius: 15,         // px -- must be within this of a partner to reproduce
    reproductionCooldownTicks: 50,
  },

  wolf: {
    maxCount: 500,
    initialCount: 10,
    speed: 2.0,
    passiveDrainPerTick: 0.08,
    movementDrainMultiplier: 0.025,
    huntDrainMultiplier: 1.6,    // multiplies movement drain when in hunt mode
    startHuntLevel: 55,          // enter hunt mode when energy drops below this
    stopHuntLevel: 80,           // exit hunt mode when energy rises above this
    catchRadius: 12,             // px -- deer within this are killed instantly
    huntEnergyGain: 40,          // energy gained per deer killed
    viewRadius: 180,
    flockThreshold: 4000,
    reproduceThreshold: 85,
    reproduceDrain: 35,
    reproduceRadius: 15,
    reproductionCooldownTicks: 80,
    grassSlowThreshold: 60,      // grass level above which wolf begins to slow
    grassSlowFactor: 0.5,        // speed multiplier at max grass level (linear interp)
  },
};
```

---

## 6. Behavior System

### 6.1 Mode Resolution

Evaluated top-down each tick. First matching condition wins.

Deer:
1. flee       -- any wolf exists within fearRadius
2. graze      -- energy < startGrazeLevel, OR (currently graze AND energy < stopGrazeLevel)
3. reproduce  -- energy > reproduceThreshold AND reproductionCooldown == 0
4. wander     -- default

Wolf:
1. hunt       -- energy < startHuntLevel, OR (currently hunt AND energy < stopHuntLevel)
2. reproduce  -- energy > reproduceThreshold AND reproductionCooldown == 0
3. wander     -- default

### 6.2 Movement

Each tick, a behavior returns a desired heading (radians). Movement is applied as:

```ts
function resolveHeading(currentHeading: number, desired: number, prng: PRNG): number {
  const momentum = 0.85;
  const noise = (prng() - 0.5) * 0.3; // radians
  return currentHeading * momentum + desired * (1 - momentum) + noise;
}

function effectiveSpeed(actor: Wolf | Deer, grassLevel: number, config: Config): number {
  let speed = config.speed;
  if (actor.kind === 'wolf' && grassLevel > config.grassSlowThreshold) {
    const t = (grassLevel - config.grassSlowThreshold) / (100 - config.grassSlowThreshold);
    speed *= 1 - t * (1 - config.grassSlowFactor);
  }
  return speed;
}
```

After computing new heading and speed:

```ts
actor.x = clamp(actor.x + Math.cos(heading) * speed, 0, mapWidth);
actor.y = clamp(actor.y + Math.sin(heading) * speed, 0, mapHeight);
```

### 6.3 Behavior Details

**Flee (deer only)**
- Collect all wolves within fearRadius.
- Compute centroid of those wolves.
- Desired heading = angle directly away from centroid.
- Movement drain is multiplied by fleeDrainMultiplier.

**Graze (deer only)**
- Look up the cell at the deer's current position.
- If cell.level > 0:
  - Reduce cell.level by grazeRate (floor at 0).
  - Gain grazeEnergyGain energy.
  - Desired heading: momentum-based (stay near current spot).
- If cell.level == 0:
  - Sample all cells within viewRadius.
  - Desired heading biased toward the cell with the highest grass level.
  - If no grass found, fall through to wander heading.

**Hunt (wolf only)**
- Find the nearest deer within viewRadius.
- Bias desired heading toward it.
- If any deer is within catchRadius:
  - Remove that deer from the world.
  - Gain huntEnergyGain energy.
- Movement drain is multiplied by huntDrainMultiplier.

**Reproduce (deer and wolf)**
- Find the nearest same-species actor that is also in reproduce mode, within viewRadius.
- Bias desired heading toward it.
- If that actor is within reproduceRadius:
  - Drain reproduceDrain energy from both.
  - Spawn one offspring at the midpoint with a small PRNG offset (within ~5px).
  - Offspring: energy = 50, heading = prng() * 2 * PI, cooldown = 0.
  - Set reproductionCooldown on both parents.
  - Reproduction blocked if population is at maxCount.

**Wander (deer and wolf)**
- Collect same-species peers within viewRadius.
- Compute average squared distance to those peers.
- If avg squared distance > flockThreshold (or no peers found):
  - Compute centroid of visible peers.
  - Mix desired heading toward centroid.
- Else:
  - Purely momentum-based walk with PRNG noise (no flock bias).

### 6.4 Energy Accounting

Per tick, after movement:

```
distanceMoved = speed (px moved this tick)

modeDrainMultiplier =
  flee mode  -> fleeDrainMultiplier  (deer)
  hunt mode  -> huntDrainMultiplier  (wolf)
  otherwise  -> 1.0

energyDelta =
  - passiveDrainPerTick
  - (distanceMoved * movementDrainMultiplier * modeDrainMultiplier)
  + activityGain  (grazeEnergyGain while grazing, huntEnergyGain on kill)

actor.energy = clamp(actor.energy + energyDelta, 0, 100)
```

Actor is removed from the world when energy <= 0.

Decrement reproductionCooldown by 1 each tick (floor at 0).

---

## 7. Grass

Per tick, iterate every cell in the grid:

```ts
if (cell.level < cell.maxLevel) {
  cell.level = Math.min(cell.level + growthRatePerTick, cell.maxLevel);
}
```

Grass does not spread to adjacent cells.
Consumption by a grazing deer reduces cell.level, floored at 0.

---

## 8. Rendering

Two draw phases on a single canvas element, each frame:

**Phase 1 -- Grass layer**
- For each cell with level > 0:
  - fillRect with color rgba(34, 180, 34, alpha)
  - alpha = cell.level / cell.maxLevel
- Cells with level == 0 are not drawn (transparent background shows through).

**Phase 2 -- Actor layer**
- Deer: filled circle, radius 4px, color #8B6914
- Wolf: filled circle, radius 5px, color #CC2200
- Draw in a single pass over each array.

Clear the canvas each frame before drawing.

**Population graph**
- Separate canvas element below the main canvas. Suggested size: 800 x 120 px.
- Three lines:
  - Deer count: #8B6914
  - Wolf count: #CC2200
  - Grass coverage %: #22B422
- X axis: sliding window of the last 500 recorded ticks.
- Y axis left: actor count. Y axis right: grass coverage percent.
- Recorded once per tick into populationHistory. Render from that array.

---

## 9. Placement UI

Placement is only active when the simulation is stopped (not started, or reset).

**Toolbar** (rendered above the canvas):

Type selector (mutually exclusive toggle):
  [ Wolf ] [ Deer ] [ Grass ]

Count/brush selector:
  - When Wolf or Deer selected: [ 1 ] [ 2 ] [ 5 ] [ 10 ] -- number of actors placed per click
  - When Grass selected: brush radius in cells: [ 1 ] [ 2 ] [ 5 ] [ 10 ]

**Click behavior:**
- Wolf/Deer: on click, place N actors at positions randomly offset from click point
  within a ~20px radius using the PRNG. Each actor spawns with energy = 50 and
  a random heading.
- Grass: on click and drag, paint all cells within brush radius to maxLevel.

Clicks on canvas while simulation is running are ignored.

---

## 10. Simulation Controls

Controls rendered above the canvas:

```
Seed: [ input:text ]    [ Start ] [ Stop ] [ Reset ]    Speed: [ 1x ] [ 2x ] [ 4x ]
```

- Start: begin tick loop. Use setInterval or requestAnimationFrame.
  - At 2x speed: run 2 ticks per frame. At 4x: run 4 ticks per frame.
- Stop: pause tick loop. Canvas and state preserved.
- Reset:
  - Recreate PRNG from current seed value.
  - Clear all actors and population history.
  - Re-run initial random placement using the PRNG.
  - Reset tick counter to 0.
  - Re-render canvas.
- Seed input: changing value takes effect on next reset only.
- Speed multiplier: takes effect immediately.

---

## 11. Config Panel

A collapsible panel (below controls or in a sidebar) containing sliders or number inputs
for every value defined in DEFAULTS. Group by section: Grass, Deer, Wolf.

Changes to config values take effect on the next reset only.
Do not apply config mid-simulation.

---

## 12. Initial State

On first load and on every reset, use the PRNG to place a starting world:

- Grass: randomly set ~30% of cells to a random level between 20 and maxLevel.
- Deer: place initialCount deer at random positions.
- Wolves: place initialCount wolves at random positions.

All positions and offsets use the PRNG so the initial state is fully reproducible from the seed.

---

## 13. Actor Limits

| Actor | Hard cap |
|-------|----------|
| Deer  | 500      |
| Wolf  | 500      |

Reproduction is silently blocked when the species is at its cap.
User-placed actors via the placement tool are also blocked at the cap.

---

## 14. Engine Tick Order

Within a single tick, apply updates in this order to avoid order-of-update artifacts:

1. Grow grass (all cells).
2. Resolve modes for all deer and wolves.
3. Compute desired headings for all actors (read-only world state snapshot if needed).
4. Apply movement and energy accounting for all actors.
5. Apply interactions in this order:
   a. Wolf kills: remove deer within catchRadius of each wolf.
   b. Reproduction: spawn offspring for qualifying pairs.
6. Remove dead actors (energy <= 0).
7. Decrement reproduction cooldowns.
8. Record population snapshot into populationHistory.

---

## 15. Deployment

Configure vite.config.ts with the correct base path for GitHub Pages.
Include a GitHub Actions workflow that builds and deploys to gh-pages branch on push to main.
