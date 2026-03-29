import type { Actor } from '../world';

export type ReproduceResult = {
  desiredHeading: number;
  partner: Actor | null;
};

export function reproduce(
  actor: Actor,
  peers: Actor[],
  viewRadius: number,
  reproduceRadius: number,
): ReproduceResult {
  // Find nearest same-species actor also in reproduce mode
  let nearest: Actor | null = null;
  let nearestDist2 = Infinity;

  for (const p of peers) {
    if (p.mode !== 'reproduce') continue;
    const dx = p.x - actor.x;
    const dy = p.y - actor.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < viewRadius * viewRadius && dist2 < nearestDist2) {
      nearestDist2 = dist2;
      nearest = p;
    }
  }

  if (!nearest) {
    return { desiredHeading: actor.heading, partner: null };
  }

  const heading = Math.atan2(nearest.y - actor.y, nearest.x - actor.x);

  if (nearestDist2 <= reproduceRadius * reproduceRadius) {
    return { desiredHeading: heading, partner: nearest };
  }

  return { desiredHeading: heading, partner: null };
}
