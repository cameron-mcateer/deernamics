import type { Actor } from '../world';
import type { PRNG } from '../prng';

export function wander(
  actor: Actor,
  peers: Actor[],
  flockThreshold: number,
  _prng: PRNG,
): number {
  if (peers.length === 0) {
    return actor.heading;
  }

  let sumDist2 = 0;
  let cx = 0;
  let cy = 0;
  for (const p of peers) {
    const dx = p.x - actor.x;
    const dy = p.y - actor.y;
    sumDist2 += dx * dx + dy * dy;
    cx += p.x;
    cy += p.y;
  }
  const avgDist2 = sumDist2 / peers.length;

  if (avgDist2 > flockThreshold) {
    cx /= peers.length;
    cy /= peers.length;
    return Math.atan2(cy - actor.y, cx - actor.x);
  }

  // No flock bias — just keep current heading (momentum + noise applied later)
  return actor.heading;
}
