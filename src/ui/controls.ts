import type { SimConfig } from '../config';

export type ControlCallbacks = {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  getSeed: () => number;
  setSeed: (seed: number) => void;
  onExport: () => void;
  onImport: (json: string) => void;
};

export function createControls(container: HTMLElement, callbacks: ControlCallbacks) {
  const seedLabel = document.createElement('label');
  seedLabel.textContent = 'Seed: ';
  const seedInput = document.createElement('input');
  seedInput.type = 'text';
  seedInput.value = String(callbacks.getSeed());
  seedInput.style.width = '60px';
  seedInput.addEventListener('change', () => {
    const val = parseInt(seedInput.value, 10);
    if (!isNaN(val)) callbacks.setSeed(val);
  });
  seedLabel.appendChild(seedInput);

  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start';
  startBtn.addEventListener('click', callbacks.onStart);

  const stopBtn = document.createElement('button');
  stopBtn.textContent = 'Stop';
  stopBtn.addEventListener('click', callbacks.onStop);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', callbacks.onReset);

  const speedLabel = document.createElement('label');
  speedLabel.textContent = 'Speed: ';

  const speeds = [1, 2, 4];
  const speedBtns: HTMLButtonElement[] = [];
  for (const s of speeds) {
    const btn = document.createElement('button');
    btn.textContent = `${s}x`;
    btn.addEventListener('click', () => {
      callbacks.onSpeedChange(s);
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    if (s === 1) btn.classList.add('active');
    speedBtns.push(btn);
  }

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export';
  exportBtn.addEventListener('click', callbacks.onExport);

  const importBtn = document.createElement('button');
  importBtn.textContent = 'Import';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    file.text().then(json => {
      callbacks.onImport(json);
      fileInput.value = '';
    });
  });
  importBtn.addEventListener('click', () => fileInput.click());

  container.append(
    seedLabel, startBtn, stopBtn, resetBtn,
    speedLabel, ...speedBtns,
    exportBtn, importBtn, fileInput,
  );

  return {
    setRunning(isRunning: boolean) {
      seedInput.disabled = isRunning;
      for (const btn of speedBtns) btn.disabled = isRunning;
      exportBtn.disabled = isRunning;
      importBtn.disabled = isRunning;
    },
    updateSeedDisplay(seed: number) {
      seedInput.value = String(seed);
    },
  };
}

type FieldMeta = { label: string; tooltip: string };

const FIELD_META: Record<string, Record<string, FieldMeta>> = {
  grass: {
    maxLevel: { label: 'Max Level', tooltip: 'Maximum grass level a cell can reach' },
    growthRatePerTick: { label: 'Growth Rate', tooltip: 'Amount of grass added per tick to cells that have grass' },
  },
  deer: {
    maxCount: { label: 'Max Population', tooltip: 'Hard cap on total deer. Reproduction blocked at this limit' },
    initialCount: { label: 'Initial Count', tooltip: 'Number of deer placed on first load' },
    speed: { label: 'Speed', tooltip: 'Base movement speed in pixels per tick' },
    passiveDrainPerTick: { label: 'Passive Drain', tooltip: 'Energy lost per tick regardless of activity' },
    movementDrainMultiplier: { label: 'Movement Drain', tooltip: 'Additional energy lost per pixel moved' },
    fleeDrainMultiplier: { label: 'Flee Drain Multiplier', tooltip: 'Multiplier on movement drain when fleeing wolves' },
    startGrazeLevel: { label: 'Start Graze At', tooltip: 'Energy threshold below which deer begin grazing' },
    stopGrazeLevel: { label: 'Stop Graze At', tooltip: 'Energy level at which deer stop grazing' },
    grazeRate: { label: 'Graze Rate', tooltip: 'Grass level consumed per tick while grazing' },
    grazeEnergyGain: { label: 'Graze Energy Gain', tooltip: 'Energy gained per tick while grazing on a cell with grass' },
    grazePreserveThreshold: { label: 'Preserve Threshold %', tooltip: 'Won\'t consume cells at or below this grass % if better grass is nearby' },
    fearRadius: { label: 'Fear Radius', tooltip: 'Distance (px) at which wolves trigger flee behavior' },
    viewRadius: { label: 'View Radius', tooltip: 'Distance (px) deer can see peers, grass, and threats' },
    flockThreshold: { label: 'Flock Threshold', tooltip: 'Avg squared distance to peers above which deer flock together' },
    reproduceThreshold: { label: 'Reproduce At', tooltip: 'Energy must exceed this to enter reproduce mode' },
    reproduceDrain: { label: 'Reproduce Cost', tooltip: 'Energy drained from each parent on reproduction' },
    reproduceRadius: { label: 'Reproduce Radius', tooltip: 'Distance (px) partners must be within to reproduce' },
    reproductionCooldownTicks: { label: 'Reproduce Cooldown', tooltip: 'Ticks after reproduction before the deer can reproduce again' },
  },
  wolf: {
    maxCount: { label: 'Max Population', tooltip: 'Hard cap on total wolves. Reproduction blocked at this limit' },
    initialCount: { label: 'Initial Count', tooltip: 'Number of wolves placed on first load' },
    speed: { label: 'Speed', tooltip: 'Base movement speed in pixels per tick' },
    passiveDrainPerTick: { label: 'Passive Drain', tooltip: 'Energy lost per tick regardless of activity' },
    movementDrainMultiplier: { label: 'Movement Drain', tooltip: 'Additional energy lost per pixel moved' },
    huntDrainMultiplier: { label: 'Hunt Drain Multiplier', tooltip: 'Multiplier on movement drain when actively hunting' },
    startHuntLevel: { label: 'Start Hunt At', tooltip: 'Energy threshold below which wolves begin hunting' },
    stopHuntLevel: { label: 'Stop Hunt At', tooltip: 'Energy level at which wolves stop hunting' },
    catchRadius: { label: 'Catch Radius', tooltip: 'Distance (px) at which a wolf kills a deer instantly' },
    huntEnergyGain: { label: 'Hunt Energy Gain', tooltip: 'Energy gained per deer killed' },
    viewRadius: { label: 'View Radius', tooltip: 'Distance (px) wolves can see deer and peers' },
    flockThreshold: { label: 'Flock Threshold', tooltip: 'Avg squared distance to peers above which wolves flock together' },
    reproduceThreshold: { label: 'Reproduce At', tooltip: 'Energy must exceed this to enter reproduce mode' },
    reproduceDrain: { label: 'Reproduce Cost', tooltip: 'Energy drained from each parent on reproduction' },
    reproduceRadius: { label: 'Reproduce Radius', tooltip: 'Distance (px) partners must be within to reproduce' },
    reproductionCooldownTicks: { label: 'Reproduce Cooldown', tooltip: 'Ticks after reproduction before the wolf can reproduce again' },
    grassSlowThreshold: { label: 'Grass Slow Threshold', tooltip: 'Grass level above which wolves begin to slow down' },
    grassSlowFactor: { label: 'Grass Slow Factor', tooltip: 'Speed multiplier at maximum grass level (lower = slower)' },
  },
};

export function createConfigPanel(
  container: HTMLElement,
  getConfig: () => SimConfig,
  onConfigChange: (path: string, value: number) => void,
) {
  const wrapper = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Configuration';
  wrapper.appendChild(summary);

  const allInputs: HTMLInputElement[] = [];
  type InputEntry = { input: HTMLInputElement; prefix: string; key: string };
  const inputMap: InputEntry[] = [];

  const sectionDefs = [
    { label: 'Grass', prefix: 'grass' },
    { label: 'Deer', prefix: 'deer' },
    { label: 'Wolf', prefix: 'wolf' },
  ] as const;

  function getSection(prefix: string): Record<string, number> {
    const cfg = getConfig();
    return cfg[prefix as keyof typeof cfg] as unknown as Record<string, number>;
  }

  const config = getConfig();
  for (const sectionDef of sectionDefs) {
    const details = document.createElement('details');
    const sum = document.createElement('summary');
    sum.textContent = sectionDef.label;
    details.appendChild(sum);

    const grid = document.createElement('div');
    grid.className = 'config-section';

    const initialObj = config[sectionDef.prefix as keyof typeof config] as unknown as Record<string, number>;
    for (const [key, val] of Object.entries(initialObj)) {
      if (typeof val !== 'number') continue;

      const field = document.createElement('div');
      field.className = 'config-field';

      const meta = FIELD_META[sectionDef.prefix]?.[key];

      const label = document.createElement('label');
      label.textContent = meta?.label ?? key;
      if (meta?.tooltip) label.setAttribute('data-tooltip', meta.tooltip);

      const input = document.createElement('input');
      input.type = 'number';
      input.value = String(val);
      input.step = val < 1 ? '0.01' : val < 10 ? '0.5' : '1';
      const prefix = sectionDef.prefix;
      const applyValue = () => {
        const v = parseFloat(input.value);
        if (!isNaN(v)) {
          getSection(prefix)[key] = v;
          onConfigChange(`${prefix}.${key}`, v);
        }
      };
      input.addEventListener('change', applyValue);
      input.addEventListener('input', applyValue);

      allInputs.push(input);
      inputMap.push({ input, prefix, key });
      field.append(label, input);
      grid.appendChild(field);
    }

    details.appendChild(grid);
    wrapper.appendChild(details);
  }

  container.appendChild(wrapper);

  return {
    setDisabled(disabled: boolean) {
      for (const input of allInputs) input.disabled = disabled;
    },
    refreshValues() {
      for (const { input, prefix, key } of inputMap) {
        input.value = String(getSection(prefix)[key]);
      }
    },
  };
}
