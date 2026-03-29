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
    fearRadius: number;
    viewRadius: number;
    flockThreshold: number;
    reproduceThreshold: number;
    reproduceDrain: number;
    reproduceRadius: number;
    reproductionCooldownTicks: number;
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
    growthRatePerTick: 0.5,
  },
  deer: {
    maxCount: 500,
    initialCount: 40,
    speed: 1.5,
    passiveDrainPerTick: 0.02,
    movementDrainMultiplier: 0.02,
    fleeDrainMultiplier: 1.8,
    startGrazeLevel: 50,
    stopGrazeLevel: 75,
    grazeRate: 5,
    grazeEnergyGain: 8,
    fearRadius: 120,
    viewRadius: 150,
    flockThreshold: 3000,
    reproduceThreshold: 85,
    reproduceDrain: 30,
    reproduceRadius: 15,
    reproductionCooldownTicks: 50,
  },
  wolf: {
    maxCount: 500,
    initialCount: 10,
    speed: 2.0,
    passiveDrainPerTick: 0.08,
    movementDrainMultiplier: 0.025,
    huntDrainMultiplier: 1.6,
    startHuntLevel: 55,
    stopHuntLevel: 80,
    catchRadius: 12,
    huntEnergyGain: 40,
    viewRadius: 180,
    flockThreshold: 4000,
    reproduceThreshold: 85,
    reproduceDrain: 35,
    reproduceRadius: 15,
    reproductionCooldownTicks: 80,
    grassSlowThreshold: 60,
    grassSlowFactor: 0.5,
  },
};

export function createConfig(): SimConfig {
  return structuredClone(DEFAULTS);
}
