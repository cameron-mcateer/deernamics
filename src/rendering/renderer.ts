import type { WorldState } from '../simulation/world';
import type { SimConfig } from '../config';

export function createRenderer(canvas: HTMLCanvasElement, config: SimConfig) {
  const ctx = canvas.getContext('2d')!;

  return {
    render(world: WorldState) {
      const { width, height, cellSize } = config.map;
      ctx.clearRect(0, 0, width, height);

      // Phase 1: Grass layer
      const cols = width / cellSize;
      const rows = height / cellSize;
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const cell = world.grass[col][row];
          if (cell.level > 0) {
            const alpha = cell.level / cell.maxLevel;
            ctx.fillStyle = `rgba(34,180,34,${alpha})`;
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        }
      }

      // Phase 2: Actor layer
      // Deer
      ctx.fillStyle = '#8B6914';
      for (const deer of world.deer) {
        ctx.beginPath();
        ctx.arc(deer.x, deer.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wolves
      ctx.fillStyle = '#CC2200';
      for (const wolf of world.wolves) {
        ctx.beginPath();
        ctx.arc(wolf.x, wolf.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    renderMessage(text: string) {
      const { width, height } = config.map;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, height / 2 - 40, width, 80);
      ctx.fillStyle = '#e0e0e0';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    },
  };
}
