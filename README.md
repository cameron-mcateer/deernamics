# Deernamics

A browser-based predator-prey ecosystem simulation. Place wolves, deer, and grass on a 2D canvas, tune behavioral parameters, and watch emergent population dynamics unfold in real time.

**Live demo:** [cameron-mcateer.github.io/deernamics](https://cameron-mcateer.github.io/deernamics/)

## Features

- Place and remove actors (wolves, deer, grass) with brush tools
- Configurable behavioral parameters: speed, energy, reproduction, fear, flocking, and more
- Emergent dynamics: deer graze and flee, wolves hunt, grass grows and spreads
- Ecological feedback loops: deer trampling suppresses grass; wolf fertilization restores it
- Seedable PRNG for deterministic replay
- Population graph tracking deer, wolf, and grass coverage over time
- Export/import map configs as JSON for sharing scenarios
- Info panel documenting all actor behaviors and config fields

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn

### Install and Run

```sh
yarn install
yarn dev
```

Open `http://localhost:5173/deernamics/` in your browser.

### Build

```sh
yarn build
```

Output goes to `dist/`.

### Preview Production Build

```sh
yarn preview
```

## Deployment

Deploys to GitHub Pages via GitHub Actions on push to `main`. The workflow is at `.github/workflows/deploy.yml` — it runs `yarn build` and publishes the `dist/` directory. Pages must be configured with `build_type: workflow` (not "deploy from branch").

## Code Organization

```
src/
  main.ts                     App entry point, state management, main loop
  config.ts                   SimConfig type, default values
  serialization.ts            JSON export/import with binary grass encoding

  simulation/
    prng.ts                   Mulberry32 seedable PRNG
    world.ts                  Data model (WorldState, Deer, Wolf, GrassCell)
    engine.ts                 Tick loop: grass growth, trampling, fertilization,
                              mode resolution, movement, kills, reproduction
    behaviors/
      flee.ts                 Deer flees from nearby wolves
      graze.ts                Deer consumes grass or seeks greener cells
      hunt.ts                 Wolf chases and catches deer
      reproduce.ts            Partner-seeking and offspring spawning
      wander.ts               Momentum-based movement with flocking bias

  rendering/
    renderer.ts               Canvas drawing: grass layer + actor layer
    graph.ts                  Population history line graph

  ui/
    controls.ts               Seed, start/stop/reset, speed, export/import buttons
    placement.ts              Place/remove toolbar, canvas mouse interaction
    info-panel.ts             Tabbed panel: guide + actor behavior docs
    field-meta.ts             Labels and tooltips for all config fields
    tooltip.ts                Body-level tooltip system
```

## How the Simulation Works

Each tick follows this order:

1. **Grow grass** on cells that have it
2. **Deer trampling** — high deer density suppresses growth and damages grass
3. **Wolf fertilization** — wolf presence boosts grass growth and seeds empty cells
4. **Resolve modes** — each actor picks a behavior (flee/graze/hunt/reproduce/wander)
5. **Compute headings** — behaviors return desired directions
6. **Apply movement** — heading blended with momentum and noise, energy drained
7. **Wolf kills** — deer within catch radius are removed
8. **Reproduction** — qualifying pairs spawn offspring
9. **Remove dead** — actors at zero energy are removed
10. **Record history** — population snapshot for the graph

## License

MIT
