export type FieldMeta = { label: string; tooltip: string };

export const FIELD_META: Record<string, Record<string, FieldMeta>> = {
  grass: {
    maxLevel: { label: 'Max Level', tooltip: 'Maximum grass level a cell can reach' },
    growthRatePerTick: { label: 'Growth Rate', tooltip: 'Amount of grass added per tick to cells that have grass' },
  },
  deer: {
    maxCount: { label: 'Max Population', tooltip: 'Hard cap on total deer. Reproduction blocked at this limit' },
    initialCount: { label: 'Initial Count', tooltip: 'Number of deer placed on first load' },
    speed: { label: 'Speed', tooltip: 'Base movement speed in pixels per tick' },
    passiveDrainPerTick: { label: 'Passive Drain', tooltip: 'Energy lost per tick regardless of activity' },
    movementDrainMultiplier: { label: 'Movement Drain', tooltip: 'Additional energy lost per pixel moved' },
    fleeDrainMultiplier: { label: 'Flee Drain Multiplier', tooltip: 'Multiplier on movement drain when fleeing wolves' },
    startGrazeLevel: { label: 'Start Graze At', tooltip: 'Energy threshold below which deer begin grazing' },
    stopGrazeLevel: { label: 'Stop Graze At', tooltip: 'Energy level at which deer stop grazing' },
    grazeRate: { label: 'Graze Rate', tooltip: 'Grass level consumed per tick while grazing' },
    grazeEnergyGain: { label: 'Graze Energy Gain', tooltip: 'Energy gained per tick while grazing on a cell with grass' },
    grazePreserveThreshold: { label: 'Preserve Threshold %', tooltip: 'Won\'t consume cells at or below this grass % if better grass is nearby' },
    fearRadius: { label: 'Fear Radius', tooltip: 'Distance (px) at which wolves trigger flee behavior' },
    viewRadius: { label: 'View Radius', tooltip: 'Distance (px) deer can see peers, grass, and threats' },
    flockThreshold: { label: 'Flock Threshold', tooltip: 'Avg squared distance to peers above which deer flock together' },
    reproduceThreshold: { label: 'Reproduce At', tooltip: 'Energy must exceed this to enter reproduce mode' },
    reproduceDrain: { label: 'Reproduce Cost', tooltip: 'Energy drained from each parent on reproduction' },
    reproduceRadius: { label: 'Reproduce Radius', tooltip: 'Distance (px) partners must be within to reproduce' },
    reproductionCooldownTicks: { label: 'Reproduce Cooldown', tooltip: 'Ticks after reproduction before the deer can reproduce again' },
    trampleRadius: { label: 'Trample Radius', tooltip: 'Distance (px) over which deer density is measured for trampling' },
    trampleSuppressThreshold: { label: 'Trample Suppress At', tooltip: 'Deer count within radius at which grass growth begins to slow' },
    trampleDamageThreshold: { label: 'Trample Damage At', tooltip: 'Deer count within radius at which grass is actively destroyed' },
    trampleDamageRate: { label: 'Trample Damage Rate', tooltip: 'Grass level lost per tick per deer above the damage threshold' },
  },
  wolf: {
    maxCount: { label: 'Max Population', tooltip: 'Hard cap on total wolves. Reproduction blocked at this limit' },
    initialCount: { label: 'Initial Count', tooltip: 'Number of wolves placed on first load' },
    speed: { label: 'Speed', tooltip: 'Base movement speed in pixels per tick' },
    passiveDrainPerTick: { label: 'Passive Drain', tooltip: 'Energy lost per tick regardless of activity' },
    movementDrainMultiplier: { label: 'Movement Drain', tooltip: 'Additional energy lost per pixel moved' },
    huntDrainMultiplier: { label: 'Hunt Drain Multiplier', tooltip: 'Multiplier on movement drain when actively hunting' },
    startHuntLevel: { label: 'Start Hunt At', tooltip: 'Energy threshold below which wolves begin hunting' },
    stopHuntLevel: { label: 'Stop Hunt At', tooltip: 'Energy level at which wolves stop hunting' },
    catchRadius: { label: 'Catch Radius', tooltip: 'Distance (px) at which a wolf kills a deer instantly' },
    huntEnergyGain: { label: 'Hunt Energy Gain', tooltip: 'Energy gained per deer killed' },
    viewRadius: { label: 'View Radius', tooltip: 'Distance (px) wolves can see deer and peers' },
    flockThreshold: { label: 'Flock Threshold', tooltip: 'Avg squared distance to peers above which wolves flock together' },
    reproduceThreshold: { label: 'Reproduce At', tooltip: 'Energy must exceed this to enter reproduce mode' },
    reproduceDrain: { label: 'Reproduce Cost', tooltip: 'Energy drained from each parent on reproduction' },
    reproduceRadius: { label: 'Reproduce Radius', tooltip: 'Distance (px) partners must be within to reproduce' },
    reproductionCooldownTicks: { label: 'Reproduce Cooldown', tooltip: 'Ticks after reproduction before the wolf can reproduce again' },
    grassSlowThreshold: { label: 'Grass Slow Threshold', tooltip: 'Grass level above which wolves begin to slow down' },
    grassSlowFactor: { label: 'Grass Slow Factor', tooltip: 'Speed multiplier at maximum grass level (lower = slower)' },
  },
};

/** Resolve a "section.key" reference (e.g. "deer.fearRadius") to its human-readable label. */
export function getFieldLabel(ref: string): string {
  const [section, key] = ref.split('.');
  return FIELD_META[section]?.[key]?.label ?? ref;
}

export function getFieldTooltip(ref: string): string {
  const [section, key] = ref.split('.');
  return FIELD_META[section]?.[key]?.tooltip ?? '';
}
