import type { WorldState, Deer, Wolf } from '../simulation/world';
import type { SimConfig } from '../config';
import type { PRNG } from '../simulation/prng';
import { bindTooltip } from './tooltip';

export type PlacementType = 'wolf' | 'deer' | 'grass';
export type ToolMode = 'place' | 'remove';

export type PlacementState = {
  mode: ToolMode;
  type: PlacementType;
  count: number;
  brushRadius: number;
};

export function createPlacementToolbar(
  container: HTMLElement,
  onStateChange: (state: PlacementState) => void,
  onRandomize: () => void,
): PlacementState {
  const state: PlacementState = { mode: 'place', type: 'deer', count: 5, brushRadius: 30 };

  // Mode toggle: Place / Remove
  const modeButtons: HTMLButtonElement[] = [];
  for (const m of ['place', 'remove'] as ToolMode[]) {
    const btn = document.createElement('button');
    btn.textContent = m.charAt(0).toUpperCase() + m.slice(1);
    btn.addEventListener('click', () => {
      state.mode = m;
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateOptions();
      onStateChange(state);
    });
    if (m === state.mode) btn.classList.add('active');
    modeButtons.push(btn);
  }

  // Type selector (always visible) with colored borders
  const typeColors: Record<PlacementType, string> = {
    wolf: '#CC2200',
    deer: '#8B6914',
    grass: '#22B422',
  };
  const typeButtons: HTMLButtonElement[] = [];
  const types: PlacementType[] = ['wolf', 'deer', 'grass'];
  for (const t of types) {
    const btn = document.createElement('button');
    btn.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    btn.style.borderBottom = `3px solid ${typeColors[t]}`;
    btn.addEventListener('click', () => {
      state.type = t;
      state.count = t === 'grass' ? 2 : 5;
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateOptions();
      onStateChange(state);
    });
    if (t === 'deer') btn.classList.add('active');
    typeButtons.push(btn);
  }

  // Options container — shows count (place) or radius (remove)
  const optionsContainer = document.createElement('span');
  optionsContainer.style.display = 'inline-flex';
  optionsContainer.style.gap = '4px';
  optionsContainer.style.alignItems = 'center';

  const counts = [1, 2, 5, 10];
  const radiusSizes = [15, 30, 60, 120];

  function updateOptions() {
    optionsContainer.innerHTML = '';

    if (state.mode === 'place') {
      const label = state.type === 'grass' ? 'Brush: ' : 'Count: ';
      const lbl = document.createElement('label');
      lbl.textContent = label;
      optionsContainer.appendChild(lbl);

      for (const c of counts) {
        const btn = document.createElement('button');
        btn.textContent = String(c);
        btn.addEventListener('click', () => {
          state.count = c;
          updateOptions();
          onStateChange(state);
        });
        if (c === state.count) btn.classList.add('active');
        optionsContainer.appendChild(btn);
      }
    } else {
      const lbl = document.createElement('label');
      lbl.textContent = 'Radius: ';
      optionsContainer.appendChild(lbl);

      for (const r of radiusSizes) {
        const btn = document.createElement('button');
        btn.textContent = `${r}px`;
        btn.addEventListener('click', () => {
          state.brushRadius = r;
          updateOptions();
          onStateChange(state);
        });
        if (r === state.brushRadius) btn.classList.add('active');
        optionsContainer.appendChild(btn);
      }
    }
  }

  function grp(...els: HTMLElement[]): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'control-group';
    span.append(...els);
    return span;
  }

  const randomizeBtn = document.createElement('button');
  randomizeBtn.textContent = '🎲';
  randomizeBtn.setAttribute('data-tooltip', 'Randomize actors');
  bindTooltip(randomizeBtn);
  randomizeBtn.style.padding = '4px 6px';
  randomizeBtn.addEventListener('click', onRandomize);

  container.append(
    grp(...modeButtons),
    grp(...typeButtons),
    grp(optionsContainer),
    grp(randomizeBtn),
  );
  updateOptions();

  return state;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function setupCanvasPlacement(
  canvas: HTMLCanvasElement,
  getPlacement: () => PlacementState,
  getWorld: () => WorldState,
  getConfig: () => SimConfig,
  getPrng: () => PRNG,
  isRunning: () => boolean,
  onWorldChanged: () => void,
) {
  let painting = false;

  function handleAction(e: MouseEvent) {
    if (isRunning()) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const placement = getPlacement();
    const world = getWorld();
    const config = getConfig();
    const prng = getPrng();

    if (placement.mode === 'remove') {
      removeByType(world, config, mx, my, placement.brushRadius, placement.type);
      onWorldChanged();
      return;
    }

    if (placement.type === 'grass') {
      paintGrass(world, config, mx, my, placement.count);
    } else if (placement.type === 'deer') {
      placeDeer(world, config, prng, mx, my, placement.count);
    } else {
      placeWolves(world, config, prng, mx, my, placement.count);
    }
    onWorldChanged();
  }

  canvas.addEventListener('mousedown', (e) => {
    if (isRunning()) return;
    painting = true;
    handleAction(e);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!painting || isRunning()) return;
    const placement = getPlacement();
    if (placement.mode === 'remove' || placement.type === 'grass') {
      handleAction(e);
    }
  });

  canvas.addEventListener('mouseup', () => { painting = false; });
  canvas.addEventListener('mouseleave', () => { painting = false; });

  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });
}

function removeByType(
  world: WorldState,
  config: SimConfig,
  mx: number,
  my: number,
  radius: number,
  type: PlacementType,
) {
  const r2 = radius * radius;
  if (type === 'deer') {
    world.deer = world.deer.filter(d => {
      const dx = d.x - mx;
      const dy = d.y - my;
      return dx * dx + dy * dy > r2;
    });
  } else if (type === 'wolf') {
    world.wolves = world.wolves.filter(w => {
      const dx = w.x - mx;
      const dy = w.y - my;
      return dx * dx + dy * dy > r2;
    });
  } else {
    // Grass: clear cells within brush radius
    const cellSize = config.map.cellSize;
    const cols = config.map.width / cellSize;
    const rows = config.map.height / cellSize;
    const cellRadius = Math.ceil(radius / cellSize);
    const centerCol = Math.floor(mx / cellSize);
    const centerRow = Math.floor(my / cellSize);

    for (let dc = -cellRadius; dc <= cellRadius; dc++) {
      for (let dr = -cellRadius; dr <= cellRadius; dr++) {
        const c = centerCol + dc;
        const r = centerRow + dr;
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        const px = (c + 0.5) * cellSize;
        const py = (r + 0.5) * cellSize;
        const dx = px - mx;
        const dy = py - my;
        if (dx * dx + dy * dy <= r2) {
          world.grass[c][r].level = 0;
        }
      }
    }
  }
}

function paintGrass(world: WorldState, config: SimConfig, mx: number, my: number, brushRadius: number) {
  const cellSize = config.map.cellSize;
  const cols = config.map.width / cellSize;
  const rows = config.map.height / cellSize;
  const centerCol = Math.floor(mx / cellSize);
  const centerRow = Math.floor(my / cellSize);

  for (let dc = -brushRadius; dc <= brushRadius; dc++) {
    for (let dr = -brushRadius; dr <= brushRadius; dr++) {
      if (dc * dc + dr * dr > brushRadius * brushRadius) continue;
      const c = centerCol + dc;
      const r = centerRow + dr;
      if (c >= 0 && c < cols && r >= 0 && r < rows) {
        world.grass[c][r].level = world.grass[c][r].maxLevel;
      }
    }
  }
}

function placeDeer(world: WorldState, config: SimConfig, prng: PRNG, mx: number, my: number, count: number) {
  for (let i = 0; i < count; i++) {
    if (world.deer.length >= config.deer.maxCount) break;
    const ox = (prng() - 0.5) * 40;
    const oy = (prng() - 0.5) * 40;
    const deer: Deer = {
      id: world.nextId++,
      kind: 'deer',
      x: clamp(mx + ox, 0, config.map.width),
      y: clamp(my + oy, 0, config.map.height),
      energy: 50,
      heading: prng() * Math.PI * 2,
      mode: 'wander',
      reproductionCooldown: 0,
    };
    world.deer.push(deer);
  }
}

function placeWolves(world: WorldState, config: SimConfig, prng: PRNG, mx: number, my: number, count: number) {
  for (let i = 0; i < count; i++) {
    if (world.wolves.length >= config.wolf.maxCount) break;
    const ox = (prng() - 0.5) * 40;
    const oy = (prng() - 0.5) * 40;
    const wolf: Wolf = {
      id: world.nextId++,
      kind: 'wolf',
      x: clamp(mx + ox, 0, config.map.width),
      y: clamp(my + oy, 0, config.map.height),
      energy: 50,
      heading: prng() * Math.PI * 2,
      mode: 'wander',
      reproductionCooldown: 0,
    };
    world.wolves.push(wolf);
  }
}
