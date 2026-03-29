import { createConfig, type SimConfig } from './config';
import { createPRNG, type PRNG } from './simulation/prng';
import { createWorld, type WorldState } from './simulation/world';
import { tick } from './simulation/engine';
import { createRenderer } from './rendering/renderer';
import { createGraphRenderer } from './rendering/graph';
import { createControls, createConfigPanel } from './ui/controls';
import { createPlacementToolbar, setupCanvasPlacement, type PlacementState } from './ui/placement';

// State
let config: SimConfig = createConfig();
let simPrng: PRNG = createPRNG(config.seed);        // simulation-only PRNG, reset on Start
let placementPrng: PRNG = createPRNG(config.seed + 1); // separate PRNG for placement
let world: WorldState = createWorld(config, simPrng);
let running = false;
let speedMultiplier = 1;

// Static map state — the "placed" state that Reset restores to
let staticState: WorldState = structuredClone(world);

function saveStaticState() {
  staticState = structuredClone(world);
}

// Canvas
const simCanvas = document.getElementById('sim-canvas') as HTMLCanvasElement;
const graphCanvas = document.getElementById('graph-canvas') as HTMLCanvasElement;

let renderer = createRenderer(simCanvas, config);
const graphRenderer = createGraphRenderer(graphCanvas);

function setRunning(value: boolean) {
  running = value;
  controls.setRunning(value);
  configPanel.setDisabled(value);
}

// Controls
const controlsContainer = document.getElementById('controls')!;
const controls = createControls(controlsContainer, {
  onStart: () => {
    // Always reset the simulation PRNG from seed on Start for deterministic replay
    simPrng = createPRNG(config.seed);
    setRunning(true);
  },
  onStop: () => { setRunning(false); },
  onReset: () => {
    setRunning(false);
    extinctionMessage = null;
    world = structuredClone(staticState);
    renderer = createRenderer(simCanvas, config);
    renderFrame();
  },
  onSpeedChange: (s) => { speedMultiplier = s; },
  getSeed: () => config.seed,
  setSeed: (s) => { config.seed = s; },
});

// Config panel — edits config directly, changes are live
const configContainer = document.getElementById('config-panel')!;
const configPanel = createConfigPanel(configContainer, config, () => {});

// Placement — uses separate PRNG, updates static state after every action
const toolbarContainer = document.getElementById('toolbar')!;
let placementState: PlacementState = createPlacementToolbar(toolbarContainer, (state) => {
  placementState = state;
});

setupCanvasPlacement(
  simCanvas,
  () => placementState,
  () => world,
  () => config,
  () => placementPrng,
  () => running,
  () => { saveStaticState(); renderFrame(); },
);

// Render
let extinctionMessage: string | null = null;

function renderFrame() {
  renderer.render(world);
  if (extinctionMessage) {
    renderer.renderMessage(extinctionMessage);
  }
  graphRenderer.render(world.populationHistory);
}

// Main loop
function loop() {
  if (running) {
    try {
      for (let i = 0; i < speedMultiplier; i++) {
        tick(world, config, simPrng);
      }
    } catch (e) {
      console.error('Tick error:', e);
      setRunning(false);
    }

    // Check for extinction
    if (world.deer.length === 0 && world.wolves.length === 0) {
      extinctionMessage = 'All animals have died out';
      setRunning(false);
    } else {
      extinctionMessage = null;
    }

    renderFrame();
  }
  requestAnimationFrame(loop);
}

// Initial render
renderFrame();
requestAnimationFrame(loop);
