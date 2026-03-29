import type { Deer, GrassCell } from '../world';
import type { SimConfig } from '../../config';

export type GrazeResult = {
  desiredHeading: number;
  grazed: boolean;
};

export function graze(
  deer: Deer,
  grass: GrassCell[][],
  config: SimConfig,
): GrazeResult {
  const cellSize = config.map.cellSize;
  const col = Math.floor(deer.x / cellSize);
  const row = Math.floor(deer.y / cellSize);
  const cols = config.map.width / cellSize;
  const rows = config.map.height / cellSize;

  // Clamp to valid cell
  const c = Math.max(0, Math.min(col, cols - 1));
  const r = Math.max(0, Math.min(row, rows - 1));
  const cell = grass[c][r];

  if (cell.level > 0) {
    // Consume grass
    const consumed = Math.min(cell.level, config.deer.grazeRate);
    cell.level -= consumed;
    return { desiredHeading: deer.heading, grazed: true };
  }

  // Cell empty — seek highest grass within viewRadius
  const viewR = config.deer.viewRadius;
  const cellRadius = Math.ceil(viewR / cellSize);

  let bestLevel = 0;
  let bestCol = -1;
  let bestRow = -1;

  for (let dc = -cellRadius; dc <= cellRadius; dc++) {
    for (let dr = -cellRadius; dr <= cellRadius; dr++) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;

      const px = (nc + 0.5) * cellSize;
      const py = (nr + 0.5) * cellSize;
      const dx = px - deer.x;
      const dy = py - deer.y;
      if (dx * dx + dy * dy > viewR * viewR) continue;

      if (grass[nc][nr].level > bestLevel) {
        bestLevel = grass[nc][nr].level;
        bestCol = nc;
        bestRow = nr;
      }
    }
  }

  if (bestCol >= 0) {
    const tx = (bestCol + 0.5) * cellSize;
    const ty = (bestRow + 0.5) * cellSize;
    return { desiredHeading: Math.atan2(ty - deer.y, tx - deer.x), grazed: false };
  }

  // No grass found — fall through to wander heading
  return { desiredHeading: deer.heading, grazed: false };
}
