import type { PopulationSnapshot } from '../simulation/world';

const WINDOW_SIZE = 500;

export function createGraphRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  return {
    render(history: PopulationSnapshot[]) {
      ctx.clearRect(0, 0, w, h);

      const window = history.slice(-WINDOW_SIZE);
      if (window.length < 2) {
        ctx.fillStyle = 'rgba(10,10,18,0.8)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#555';
        ctx.font = '13px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Click \'Start\' to begin the simulation', w / 2, h / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        return;
      }

      // Compute Y scale for actors
      let maxActors = 1;
      for (const snap of window) {
        maxActors = Math.max(maxActors, snap.deer, snap.wolves);
      }
      // Round up to nearest 10 for cleaner axis
      maxActors = Math.ceil(maxActors / 10) * 10;

      const xStep = w / (WINDOW_SIZE - 1);

      // Background
      ctx.fillStyle = 'rgba(10,10,18,0.8)';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (h * i) / 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw lines helper
      function drawLine(
        data: number[],
        maxVal: number,
        color: string,
      ) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = i * xStep;
          const y = h - (data[i] / maxVal) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Deer count
      drawLine(window.map(s => s.deer), maxActors, '#8B6914');
      // Wolf count
      drawLine(window.map(s => s.wolves), maxActors, '#CC2200');
      // Grass coverage (0-1 mapped to same height)
      drawLine(window.map(s => s.grassCoverage * 100), 100, '#22B422');

      // Labels
      ctx.font = '10px system-ui';
      ctx.fillStyle = '#8B6914';
      ctx.fillText(`Deer: ${window[window.length - 1].deer}`, 8, 12);
      ctx.fillStyle = '#CC2200';
      ctx.fillText(`Wolf: ${window[window.length - 1].wolves}`, 80, 12);
      ctx.fillStyle = '#22B422';
      ctx.fillText(`Grass: ${(window[window.length - 1].grassCoverage * 100).toFixed(0)}%`, 150, 12);

      // Left axis label
      ctx.fillStyle = '#666';
      ctx.fillText(`${maxActors}`, 4, h - 4);
    },
  };
}
