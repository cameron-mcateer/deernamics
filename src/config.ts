export interface SimConfig {
  seed: number;
  map: {
    width: number;
    height: number;
    cellSize: number;
  };
  grass: {
    maxLevel: number;
    growthRatePerTick: number;
  };
  deer: {
    maxCount: number;
    initialCount: number;
    speed: number;
    passiveDrainPerTick: number;
    movementDrainMultiplier: number;
    fleeDrainMultiplier: number;
    startGrazeLevel: number;
    stopGrazeLevel: number;
    grazeRate: number;
    grazeEnergyGain: number;
    grazePreserveThreshold: number;
    fearRadius: number;
    viewRadius: number;
    flockThreshold: number;
    reproduceThreshold: number;
    reproduceDrain: number;
    reproduceRadius: number;
    reproductionCooldownTicks: number;
    trampleRadius: number;
    trampleSuppressThreshold: number;
    trampleDamageThreshold: number;
    trampleDamageRate: number;
  };
  wolf: {
    maxCount: number;
    initialCount: number;
    speed: number;
    passiveDrainPerTick: number;
    movementDrainMultiplier: number;
    huntDrainMultiplier: number;
    startHuntLevel: number;
    stopHuntLevel: number;
    catchRadius: number;
    huntEnergyGain: number;
    viewRadius: number;
    flockThreshold: number;
    reproduceThreshold: number;
    reproduceDrain: number;
    reproduceRadius: number;
    reproductionCooldownTicks: number;
    grassSlowThreshold: number;
    grassSlowFactor: number;
  };
}

export const DEFAULTS: SimConfig = {
  seed: 42,
  map: {
    width: 800,
    height: 800,
    cellSize: 10,
  },
  grass: {
    maxLevel: 100,
    growthRatePerTick: 0.01,
  },
  deer: {
    maxCount: 500,
    initialCount: 40,
    speed: 1.6,
    passiveDrainPerTick: 0.02,
    movementDrainMultiplier: 0.02,
    fleeDrainMultiplier: 1.8,
    startGrazeLevel: 50,
    stopGrazeLevel: 90,
    grazeRate: 5,
    grazeEnergyGain: 12,
    grazePreserveThreshold: 5,  // won't consume cells at or below this % if other grass nearby
    fearRadius: 120,
    viewRadius: 150,
    flockThreshold: 3000,
    reproduceThreshold: 60,
    reproduceDrain: 30,
    reproduceRadius: 15,
    reproductionCooldownTicks: 50,
    trampleRadius: 20,
    trampleSuppressThreshold: 3,
    trampleDamageThreshold: 10,
    trampleDamageRate: 0.3,
  },
  wolf: {
    maxCount: 500,
    initialCount: 10,
    speed: 2.2,
    passiveDrainPerTick: 0.07,
    movementDrainMultiplier: 0.025,
    huntDrainMultiplier: 1.6,
    startHuntLevel: 55,
    stopHuntLevel: 90,
    catchRadius: 12,
    huntEnergyGain: 40,
    viewRadius: 180,
    flockThreshold: 4000,
    reproduceThreshold: 60,
    reproduceDrain: 35,
    reproduceRadius: 15,
    reproductionCooldownTicks: 70,
    grassSlowThreshold: 80,
    grassSlowFactor: 0.8,
  },
};

export function createConfig(): SimConfig {
  return structuredClone(DEFAULTS);
}
