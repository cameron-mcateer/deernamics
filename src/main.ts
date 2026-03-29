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
let pendingConfig: SimConfig = createConfig();
let prng: PRNG = createPRNG(config.seed);
let world: WorldState = createWorld(config, prng);
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
  onStart: () => { setRunning(true); },
  onStop: () => { setRunning(false); },
  onReset: () => {
    setRunning(false);
    config = structuredClone(pendingConfig);
    prng = createPRNG(config.seed);
    world = structuredClone(staticState);
    renderer = createRenderer(simCanvas, config);
    renderFrame();
  },
  onSpeedChange: (s) => { speedMultiplier = s; },
  getSeed: () => pendingConfig.seed,
  setSeed: (s) => { pendingConfig.seed = s; },
});

// Config panel
const configContainer = document.getElementById('config-panel')!;
const configPanel = createConfigPanel(configContainer, pendingConfig, () => {});

// Placement — updates static state after every action
const toolbarContainer = document.getElementById('toolbar')!;
let placementState: PlacementState = createPlacementToolbar(toolbarContainer, (state) => {
  placementState = state;
});

setupCanvasPlacement(
  simCanvas,
  () => placementState,
  () => world,
  () => config,
  () => prng,
  () => running,
  () => { saveStaticState(); renderFrame(); },
);

// Render
function renderFrame() {
  renderer.render(world);
  graphRenderer.render(world.populationHistory);
}

// Main loop
function loop() {
  if (running) {
    try {
      for (let i = 0; i < speedMultiplier; i++) {
        tick(world, config, prng);
      }
    } catch (e) {
      console.error('Tick error:', e);
      setRunning(false);
    }
    renderFrame();
  }
  requestAnimationFrame(loop);
}

// Initial render
renderFrame();
requestAnimationFrame(loop);
