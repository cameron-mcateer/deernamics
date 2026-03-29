import type { Deer, Wolf } from '../world';

export function flee(deer: Deer, nearbyWolves: Wolf[]): number {
  if (nearbyWolves.length === 0) {
    return deer.heading;
  }

  let cx = 0;
  let cy = 0;
  for (const w of nearbyWolves) {
    cx += w.x;
    cy += w.y;
  }
  cx /= nearbyWolves.length;
  cy /= nearbyWolves.length;

  // Head directly away from wolf centroid
  return Math.atan2(deer.y - cy, deer.x - cx);
}
