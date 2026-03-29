import type { SimConfig } from '../config';
import { FIELD_META } from './field-meta';
import { bindTooltip } from './tooltip';

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

function group(...els: (HTMLElement | HTMLElement[])[]): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'control-group';
  for (const el of els) {
    if (Array.isArray(el)) span.append(...el);
    else span.appendChild(el);
  }
  return span;
}

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

  const randomSeedBtn = document.createElement('button');
  randomSeedBtn.textContent = '🎲';
  randomSeedBtn.setAttribute('data-tooltip', 'Randomize seed');
  bindTooltip(randomSeedBtn);
  randomSeedBtn.style.padding = '4px 6px';
  randomSeedBtn.addEventListener('click', () => {
    const newSeed = Math.floor(Math.random() * 1_000_000);
    seedInput.value = String(newSeed);
    callbacks.setSeed(newSeed);
  });

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
    group(seedLabel, randomSeedBtn),
    group(startBtn, stopBtn, resetBtn),
    group(speedLabel, ...speedBtns),
    group(exportBtn, importBtn, fileInput),
  );

  return {
    setRunning(isRunning: boolean) {
      seedInput.disabled = isRunning;
      randomSeedBtn.disabled = isRunning;
      for (const btn of speedBtns) btn.disabled = isRunning;
      exportBtn.disabled = isRunning;
      importBtn.disabled = isRunning;
    },
    updateSeedDisplay(seed: number) {
      seedInput.value = String(seed);
    },
  };
}

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
      if (meta?.tooltip) {
        label.setAttribute('data-tooltip', meta.tooltip);
        bindTooltip(label);
      }

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
