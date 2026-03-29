import type { SimConfig } from '../config';

export type ControlCallbacks = {
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  getSeed: () => number;
  setSeed: (seed: number) => void;
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

  container.append(seedLabel, startBtn, stopBtn, resetBtn, speedLabel, ...speedBtns);

  return {
    setRunning(isRunning: boolean) {
      seedInput.disabled = isRunning;
      for (const btn of speedBtns) btn.disabled = isRunning;
    },
  };
}

export function createConfigPanel(
  container: HTMLElement,
  config: SimConfig,
  onConfigChange: (path: string, value: number) => void,
) {
  const wrapper = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Configuration';
  wrapper.appendChild(summary);

  const allInputs: HTMLInputElement[] = [];

  type Section = { label: string; prefix: string; obj: Record<string, number> };
  const sections: Section[] = [
    { label: 'Grass', prefix: 'grass', obj: config.grass as unknown as Record<string, number> },
    { label: 'Deer', prefix: 'deer', obj: config.deer as unknown as Record<string, number> },
    { label: 'Wolf', prefix: 'wolf', obj: config.wolf as unknown as Record<string, number> },
  ];

  for (const section of sections) {
    const details = document.createElement('details');
    const sum = document.createElement('summary');
    sum.textContent = section.label;
    details.appendChild(sum);

    const grid = document.createElement('div');
    grid.className = 'config-section';

    for (const [key, val] of Object.entries(section.obj)) {
      if (typeof val !== 'number') continue;

      const field = document.createElement('div');
      field.className = 'config-field';

      const label = document.createElement('label');
      label.textContent = key;

      const input = document.createElement('input');
      input.type = 'number';
      input.value = String(val);
      input.step = val < 1 ? '0.01' : val < 10 ? '0.5' : '1';
      const applyValue = () => {
        const v = parseFloat(input.value);
        if (!isNaN(v)) {
          (section.obj as Record<string, number>)[key] = v;
          onConfigChange(`${section.prefix}.${key}`, v);
        }
      };
      input.addEventListener('change', applyValue);
      input.addEventListener('input', applyValue);

      allInputs.push(input);
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
  };
}
