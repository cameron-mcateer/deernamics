let tooltipEl: HTMLDivElement | null = null;
let showTimeout: ReturnType<typeof setTimeout> | null = null;

function ensureTooltip(): HTMLDivElement {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function show(target: HTMLElement) {
  const text = target.getAttribute('data-tooltip');
  if (!text) return;

  const tip = ensureTooltip();
  tip.textContent = text;
  tip.style.display = 'block';

  const rect = target.getBoundingClientRect();
  tip.style.left = `${rect.left + window.scrollX}px`;
  tip.style.top = `${rect.top + window.scrollY - tip.offsetHeight - 6}px`;
}

function hide() {
  if (showTimeout) { clearTimeout(showTimeout); showTimeout = null; }
  if (tooltipEl) tooltipEl.style.display = 'none';
}

/** Attach tooltip behavior to any element with a data-tooltip attribute. */
export function bindTooltip(el: HTMLElement) {
  el.addEventListener('mouseenter', () => {
    hide();
    showTimeout = setTimeout(() => show(el), 300);
  });
  el.addEventListener('mouseleave', hide);
}

/** Auto-bind all [data-tooltip] elements within a container. */
export function bindAllTooltips(container: HTMLElement) {
  for (const el of container.querySelectorAll<HTMLElement>('[data-tooltip]')) {
    bindTooltip(el);
  }
}
