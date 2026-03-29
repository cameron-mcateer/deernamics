import type { Wolf, Deer } from '../world';

export type HuntResult = {
  desiredHeading: number;
  killedDeer: Deer | null;
};

export function hunt(
  wolf: Wolf,
  nearbyDeer: Deer[],
  catchRadius: number,
): HuntResult {
  if (nearbyDeer.length === 0) {
    return { desiredHeading: wolf.heading, killedDeer: null };
  }

  // Find nearest deer
  let nearest: Deer | null = null;
  let nearestDist2 = Infinity;
  for (const d of nearbyDeer) {
    const dx = d.x - wolf.x;
    const dy = d.y - wolf.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < nearestDist2) {
      nearestDist2 = dist2;
      nearest = d;
    }
  }

  const heading = nearest
    ? Math.atan2(nearest.y - wolf.y, nearest.x - wolf.x)
    : wolf.heading;

  // Check for kill
  let killedDeer: Deer | null = null;
  if (nearest && nearestDist2 <= catchRadius * catchRadius) {
    killedDeer = nearest;
  }

  return { desiredHeading: heading, killedDeer };
}
