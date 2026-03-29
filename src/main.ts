import { createConfig, type SimConfig } from './config';
import { createPRNG, type PRNG } from './simulation/prng';
import { createWorld, type WorldState } from './simulation/world';
import { tick } from './simulation/engine';
import { createRenderer } from './rendering/renderer';
import { createGraphRenderer } from './rendering/graph';
import { createControls, createConfigPanel } from './ui/controls';
import { createPlacementToolbar, setupCanvasPlacement, type PlacementState } from './ui/placement';
import { serializeMap, deserializeMap } from './serialization';
import { createInfoPanel } from './ui/info-panel';

// State
let config: SimConfig = createConfig();
let simPrng: PRNG = createPRNG(config.seed);
let placementPrng: PRNG = createPRNG(config.seed + 1);
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

function loadMap(newConfig: SimConfig, newWorld: WorldState) {
  config = newConfig;
  world = newWorld;
  staticState = structuredClone(world);
  renderer = createRenderer(simCanvas, config);
  controls.updateSeedDisplay(config.seed);
  configPanel.refreshValues();
  extinctionMessage = null;
  renderFrame();
}

// Controls
const controlsContainer = document.getElementById('controls')!;
const controls = createControls(controlsContainer, {
  onStart: () => {
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
  onExport: () => {
    const json = serializeMap(config, staticState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deernamics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  onImport: (json: string) => {
    try {
      const { config: newConfig, world: newWorld } = deserializeMap(json);
      setRunning(false);
      loadMap(newConfig, newWorld);
    } catch (e) {
      console.error('Import failed:', e);
      alert('Failed to import map config. Check the file format.');
    }
  },
});

// Config panel — edits config directly, changes are live
const configContainer = document.getElementById('config-panel')!;
const configPanel = createConfigPanel(configContainer, () => config, () => {});

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

// Info panel
createInfoPanel(document.getElementById('info-panel')!);

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
