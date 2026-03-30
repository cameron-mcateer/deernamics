export type FieldMeta = { label: string; tooltip: string; category?: string };

export const FIELD_META: Record<string, Record<string, FieldMeta>> = {
  grass: {
    maxLevel: { label: 'Max Level', tooltip: 'Maximum grass level a cell can reach', category: 'General' },
    growthRatePerTick: { label: 'Growth Rate', tooltip: 'Amount of grass added per tick to cells that have grass', category: 'General' },
  },
  deer: {
    // General
    maxCount: { label: 'Max Population', tooltip: 'Hard cap on total deer. Reproduction blocked at this limit', category: 'General' },
    initialCount: { label: 'Initial Count', tooltip: 'Number of deer placed on first load', category: 'General' },
    speed: { label: 'Speed', tooltip: 'Base movement speed in pixels per tick', category: 'General' },
    passiveDrainPerTick: { label: 'Passive Drain', tooltip: 'Energy lost per tick regardless of activity', category: 'General' },
    movementDrainMultiplier: { label: 'Movement Drain', tooltip: 'Additional energy lost per pixel moved', category: 'General' },
    viewRadius: { label: 'View Radius', tooltip: 'Distance (px) deer can see peers, grass, and threats', category: 'General' },
    flockThreshold: { label: 'Flock Threshold', tooltip: 'Avg squared distance to peers above which deer flock together', category: 'General' },
    // Reproduction
    reproduceThreshold: { label: 'Reproduce At', tooltip: 'Energy must exceed this to enter reproduce mode', category: 'Reproduction' },
    reproduceDrain: { label: 'Reproduce Cost', tooltip: 'Energy drained from each parent on reproduction', category: 'Reproduction' },
    reproduceRadius: { label: 'Reproduce Radius', tooltip: 'Distance (px) partners must be within to reproduce', category: 'Reproduction' },
    reproductionCooldownTicks: { label: 'Reproduce Cooldown', tooltip: 'Ticks after reproduction before the deer can reproduce again', category: 'Reproduction' },
    // Grazing
    startGrazeLevel: { label: 'Start Graze At', tooltip: 'Energy threshold below which deer begin grazing', category: 'Grazing' },
    stopGrazeLevel: { label: 'Stop Graze At', tooltip: 'Energy level at which deer stop grazing', category: 'Grazing' },
    grazeRate: { label: 'Graze Rate', tooltip: 'Grass level consumed per tick while grazing', category: 'Grazing' },
    grazeEnergyGain: { label: 'Graze Energy Gain', tooltip: 'Energy gained per tick while grazing on a cell with grass', category: 'Grazing' },
    grazePreserveThreshold: { label: 'Preserve Threshold %', tooltip: 'Won\'t consume cells at or below this grass % if better grass is nearby', category: 'Grazing' },
    // Ecosystem Impact
    trampleRadius: { label: 'Trample Radius', tooltip: 'Distance (px) over which deer density is measured for trampling', category: 'Ecosystem Impact' },
    trampleSuppressThreshold: { label: 'Trample Suppress At', tooltip: 'Deer count within radius at which grass growth begins to slow', category: 'Ecosystem Impact' },
    trampleDamageThreshold: { label: 'Trample Damage At', tooltip: 'Deer count within radius at which grass is actively destroyed', category: 'Ecosystem Impact' },
    trampleDamageRate: { label: 'Trample Damage Rate', tooltip: 'Grass level lost per tick per deer above the damage threshold', category: 'Ecosystem Impact' },
    // Survival
    fearRadius: { label: 'Fear Radius', tooltip: 'Distance (px) at which wolves trigger flee behavior', category: 'Survival' },
    fleeDrainMultiplier: { label: 'Flee Drain Multiplier', tooltip: 'Multiplier on movement drain when fleeing wolves', category: 'Survival' },
  },
  wolf: {
    // General
    maxCount: { label: 'Max Population', tooltip: 'Hard cap on total wolves. Reproduction blocked at this limit', category: 'General' },
    initialCount: { label: 'Initial Count', tooltip: 'Number of wolves placed on first load', category: 'General' },
    speed: { label: 'Speed', tooltip: 'Base movement speed in pixels per tick', category: 'General' },
    passiveDrainPerTick: { label: 'Passive Drain', tooltip: 'Energy lost per tick regardless of activity', category: 'General' },
    movementDrainMultiplier: { label: 'Movement Drain', tooltip: 'Additional energy lost per pixel moved', category: 'General' },
    viewRadius: { label: 'View Radius', tooltip: 'Distance (px) wolves can see deer and peers', category: 'General' },
    flockThreshold: { label: 'Flock Threshold', tooltip: 'Avg squared distance to peers above which wolves flock together', category: 'General' },
    // Hunting
    huntDrainMultiplier: { label: 'Hunt Drain Multiplier', tooltip: 'Multiplier on movement drain when actively hunting', category: 'Hunting' },
    startHuntLevel: { label: 'Start Hunt At', tooltip: 'Energy threshold below which wolves begin hunting', category: 'Hunting' },
    stopHuntLevel: { label: 'Stop Hunt At', tooltip: 'Energy level at which wolves stop hunting', category: 'Hunting' },
    catchRadius: { label: 'Catch Radius', tooltip: 'Distance (px) at which a wolf kills a deer instantly', category: 'Hunting' },
    huntEnergyGain: { label: 'Hunt Energy Gain', tooltip: 'Energy gained per deer killed', category: 'Hunting' },
    grassSlowThreshold: { label: 'Grass Slow Threshold', tooltip: 'Grass level above which wolves begin to slow down', category: 'Hunting' },
    grassSlowFactor: { label: 'Grass Slow Factor', tooltip: 'Speed multiplier at maximum grass level (lower = slower)', category: 'Hunting' },
    // Reproduction
    reproduceThreshold: { label: 'Reproduce At', tooltip: 'Energy must exceed this to enter reproduce mode', category: 'Reproduction' },
    reproduceDrain: { label: 'Reproduce Cost', tooltip: 'Energy drained from each parent on reproduction', category: 'Reproduction' },
    reproduceRadius: { label: 'Reproduce Radius', tooltip: 'Distance (px) partners must be within to reproduce', category: 'Reproduction' },
    reproductionCooldownTicks: { label: 'Reproduce Cooldown', tooltip: 'Ticks after reproduction before the wolf can reproduce again', category: 'Reproduction' },
    // Ecosystem Impact
    fertilizeRadius: { label: 'Fertilize Radius', tooltip: 'Distance (px) over which wolf density is measured for grass fertilization', category: 'Ecosystem Impact' },
    fertilizeThreshold: { label: 'Fertilize At', tooltip: 'Wolf count within radius needed to trigger fertilization effects', category: 'Ecosystem Impact' },
    fertilizeSpreadChance: { label: 'Spread Chance', tooltip: 'Per-tick probability of seeding grass on an empty cell per wolf above threshold', category: 'Ecosystem Impact' },
    fertilizeBoost: { label: 'Growth Boost', tooltip: 'Extra grass level added per tick per wolf on cells that already have grass', category: 'Ecosystem Impact' },
  },
};

/** Resolve a "section.key" reference (e.g. "deer.fearRadius") to its human-readable label. */
export function getFieldLabel(ref: string): string {
  const [section, key] = ref.split('.');
  return FIELD_META[section]?.[key]?.label ?? ref;
}

export function getFieldTooltip(ref: string): string {
  const [section, key] = ref.split('.');
  const meta = FIELD_META[section]?.[key];
  if (!meta) return '';
  if (meta.category) return `${meta.category} > ${meta.tooltip}`;
  return meta.tooltip;
}
