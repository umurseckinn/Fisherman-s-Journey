// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE DATA — from master_prompt.md
// ─────────────────────────────────────────────────────────────────────────────

export interface VehicleSprite {
  file: string;
  nativeWidth: number;
  nativeHeight: number;
  rodTipX: number;
  rodTipY: number;
}

export interface StorageUpgrade {
  level: number;          // 1–5
  kgBonus: number;
  cost: number;
  reqLevel?: number;      // min player level to unlock
}

export interface RodUpgrade {
  level: number;          // 1–5
  swingBonus: number;     // cumulative rad/frame added to base
  castBonus: number;      // multiplier addition (cumulative)
  returnBonus: number;
  depthBonus: number;     // percentage points
  attemptsBonus: number;
  coralBonus: number;     // percentage points
  kelpReduction: number;  // seconds removed
  cost: number;
  reqLevel?: number;
}

export interface VehicleData {
  id: string;
  tier: number;
  name: string;
  captain: string;
  file: string;
  unlockCost: number;     // 0 = always owned
  minLevel: number;
  base: {
    storage: number;
    swingSpeed: number;
    castSpeed: number;
    returnSpeed: number;
    hookDepth: number;    // 0–100 %
    castAttempts: number;
    coralProtection: number; // 0–100 %
    kelpDuration: number; // seconds
    special?: string;
  };
  storageUpgrades: StorageUpgrade[];
  rodUpgrades: RodUpgrade[];
  sprite: VehicleSprite;
}

// Rod upgrade bonuses are the SAME per tier level (1-5) for all vehicles
// Cost differs per vehicle.
const ROD_BONUSES = [
  { swingBonus: 0.002, castBonus: 0.12, returnBonus: 0.10, depthBonus: 5,  attemptsBonus: 0, coralBonus: 10, kelpReduction: 0.15 },
  { swingBonus: 0.003, castBonus: 0.18, returnBonus: 0.16, depthBonus: 7,  attemptsBonus: 1, coralBonus: 15, kelpReduction: 0.20 },
  { swingBonus: 0.004, castBonus: 0.24, returnBonus: 0.22, depthBonus: 9,  attemptsBonus: 1, coralBonus: 20, kelpReduction: 0.25 },
  { swingBonus: 0.005, castBonus: 0.30, returnBonus: 0.28, depthBonus: 10, attemptsBonus: 1, coralBonus: 25, kelpReduction: 0.30 },
  { swingBonus: 0.006, castBonus: 0.36, returnBonus: 0.34, depthBonus: 11, attemptsBonus: 1, coralBonus: 30, kelpReduction: 0.35 },
];

const STORAGE_COST_MULTIPLIERS = [1.0, 2.15, 3.7, 5.9, 8.8];
const ROD_COST_MULTIPLIERS = [1.0, 2.05, 3.35, 5.4, 8.1];
const BASE_COST_MULTIPLIER = 2.2;
const TIER_COST_STEP = 0.12;

function scaleCosts(base: number, tier: number, multipliers: number[]) {
  const tierFactor = 1 + (tier - 1) * TIER_COST_STEP;
  return multipliers.map(m => Math.round(base * BASE_COST_MULTIPLIER * m * tierFactor));
}

function makeStorageUpgrades(kgBonuses: number[], baseCost: number, tier: number, reqs: (number | undefined)[]): StorageUpgrade[] {
  const costs = scaleCosts(baseCost, tier, STORAGE_COST_MULTIPLIERS);
  return kgBonuses.map((kgBonus, i) => ({
    level: i + 1,
    kgBonus,
    cost: costs[i],
    reqLevel: reqs[i],
  }));
}

function makeRodUpgrades(baseCost: number, tier: number, reqs: (number | undefined)[]): RodUpgrade[] {
  const costs = scaleCosts(baseCost, tier, ROD_COST_MULTIPLIERS);
  return costs.map((cost, i) => ({
    level: i + 1,
    ...ROD_BONUSES[i],
    cost,
    reqLevel: reqs[i],
  }));
}

export const VEHICLES: VehicleData[] = [
  // ──────────────────────────────────────────────────────
  // T1 — The Dinghy
  // ──────────────────────────────────────────────────────
  {
    id: 't1',
    tier: 1,
    name: 'The Dinghy',
    captain: 'Bobber Bill',
    file: 'the_dinghy.png',
    unlockCost: 0,
    minLevel: 1,
    base: {
      storage: 22,
      swingSpeed: 0.007,
      castSpeed: 0.40,
      returnSpeed: 0.35,
      hookDepth: 50,
      castAttempts: 1,
      coralProtection: 0,
      kelpDuration: 1.8,
    },
    storageUpgrades: makeStorageUpgrades([8, 13, 18, 24, 32], 20, 1, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(25, 1, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_dinghy.png', nativeWidth: 981,  nativeHeight: 680,  rodTipX: 571,  rodTipY: 2 },
  },

  // ──────────────────────────────────────────────────────
  // T2 — The Painted Skiff
  // ──────────────────────────────────────────────────────
  {
    id: 't2',
    tier: 2,
    name: 'The Painted Skiff',
    captain: 'Daring Danny',
    file: 'the_painted_skiff.png',
    unlockCost: 450,
    minLevel: 1,
    base: {
      storage: 32,
      swingSpeed: 0.009,
      castSpeed: 0.50,
      returnSpeed: 0.45,
      hookDepth: 56,
      castAttempts: 1,
      coralProtection: 0,
      kelpDuration: 1.6,
      special: 'kelpDuration baseline -0.2s',
    },
    storageUpgrades: makeStorageUpgrades([10, 16, 22, 28, 36], 30, 2, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(38, 2, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_painted_skiff.png', nativeWidth: 855,  nativeHeight: 710,  rodTipX: 543,  rodTipY: 2 },
  },

  // ──────────────────────────────────────────────────────
  // T3 — The Fiberglass
  // ──────────────────────────────────────────────────────
  {
    id: 't3',
    tier: 3,
    name: 'The Fiberglass',
    captain: 'Expert Eddie',
    file: 'the_fiberglass.png',
    unlockCost: 1200,
    minLevel: 6,
    base: {
      storage: 45,
      swingSpeed: 0.011,
      castSpeed: 0.62,
      returnSpeed: 0.55,
      hookDepth: 63,
      castAttempts: 2,
      coralProtection: 15,
      kelpDuration: 1.4,
    },
    storageUpgrades: makeStorageUpgrades([13, 20, 27, 34, 43], 45, 3, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(55, 3, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_fiberglass.png', nativeWidth: 1047, nativeHeight: 726,  rodTipX: 1047 * 0.11,  rodTipY: 726 * 0.2 },
  },

  // ──────────────────────────────────────────────────────
  // T4 — The Motor Cruiser
  // ──────────────────────────────────────────────────────
  {
    id: 't4',
    tier: 4,
    name: 'The Motor Cruiser',
    captain: 'Captain Ken',
    file: 'the_motor_cruiser.png',
    unlockCost: 2800,
    minLevel: 11,
    base: {
      storage: 62,
      swingSpeed: 0.014,
      castSpeed: 0.76,
      returnSpeed: 0.68,
      hookDepth: 70,
      castAttempts: 2,
      coralProtection: 20,
      kelpDuration: 1.2,
      special: 'returnSpeed +20% bonus on top of base',
    },
    storageUpgrades: makeStorageUpgrades([16, 24, 32, 42, 54], 70, 4, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(85, 4, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_motor_cruiser.png', nativeWidth: 1086, nativeHeight: 810,  rodTipX: 20,   rodTipY: 2 },
  },

  // ──────────────────────────────────────────────────────
  // T5 — The Speedster
  // ──────────────────────────────────────────────────────
  {
    id: 't5',
    tier: 5,
    name: 'The Speedster',
    captain: 'Turbo Trev',
    file: 'the_speedster.png',
    unlockCost: 4500,
    minLevel: 16,
    base: {
      storage: 78,
      swingSpeed: 0.017,
      castSpeed: 0.90,
      returnSpeed: 0.82,
      hookDepth: 76,
      castAttempts: 3,
      coralProtection: 25,
      kelpDuration: 1.0,
      special: 'swingSpeed +10% bonus',
    },
    storageUpgrades: makeStorageUpgrades([18, 28, 38, 50, 64], 100, 5, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(120, 5, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_speedster.png', nativeWidth: 1338, nativeHeight: 718,  rodTipX: 1338 * 0.67,  rodTipY: 718 * 0.15 },
  },

  // ──────────────────────────────────────────────────────
  // T6 — The Trawler
  // ──────────────────────────────────────────────────────
  {
    id: 't6',
    tier: 6,
    name: 'The Trawler',
    captain: 'Seafarer Sam',
    file: 'the_trawler.png',
    unlockCost: 3000,
    minLevel: 21,
    base: {
      storage: 96,
      swingSpeed: 0.019,
      castSpeed: 1.02,
      returnSpeed: 0.94,
      hookDepth: 82,
      castAttempts: 3,
      coralProtection: 35,
      kelpDuration: 0.85,
      special: 'skeleton cash penalty -25%',
    },
    storageUpgrades: makeStorageUpgrades([22, 34, 46, 60, 78], 140, 6, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(165, 6, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_trawler.png', nativeWidth: 1083, nativeHeight: 810,  rodTipX: 22,   rodTipY: 2 },
  },

  // ──────────────────────────────────────────────────────
  // T7 — The Captain's Vessel
  // ──────────────────────────────────────────────────────
  {
    id: 't7',
    tier: 7,
    name: "The Captain's Vessel",
    captain: 'Captain Theo',
    file: 'the_captains_vessel.png',
    unlockCost: 4667,
    minLevel: 31,
    base: {
      storage: 118,
      swingSpeed: 0.021,
      castSpeed: 1.16,
      returnSpeed: 1.08,
      hookDepth: 87,
      castAttempts: 4,
      coralProtection: 45,
      kelpDuration: 0.70,
      special: 'King Fish visual weight display shows -5 kg (UI only)',
    },
    storageUpgrades: makeStorageUpgrades([26, 40, 54, 70, 92], 190, 7, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(220, 7, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_captains_vessel.png', nativeWidth: 1128, nativeHeight: 846,  rodTipX: 1128 * 0.045,  rodTipY: 846 * 0.025 },
  },

  // ──────────────────────────────────────────────────────
  // T8 — The Research Vessel
  // ──────────────────────────────────────────────────────
  {
    id: 't8',
    tier: 8,
    name: 'The Research Vessel',
    captain: 'Professor Pippa',
    file: 'the_research_vessel.png',
    unlockCost: 7000,
    minLevel: 41,
    base: {
      storage: 144,
      swingSpeed: 0.023,
      castSpeed: 1.30,
      returnSpeed: 1.22,
      hookDepth: 91,
      castAttempts: 4,
      coralProtection: 55,
      kelpDuration: 0.55,
      special: 'Radar booster duration ×2',
    },
    storageUpgrades: makeStorageUpgrades([30, 48, 64, 84, 110], 250, 8, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(290, 8, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_research_vessel.png', nativeWidth: 1248, nativeHeight: 740,  rodTipX: 1248 * 0.06,  rodTipY: 740 * 0.22 },
  },

  // ──────────────────────────────────────────────────────
  // T9 — The Corsair
  // ──────────────────────────────────────────────────────
  {
    id: 't9',
    tier: 9,
    name: 'The Corsair',
    captain: 'Black Cam',
    file: 'the_corsair.png',
    unlockCost: 10834,
    minLevel: 61,
    base: {
      storage: 168,
      swingSpeed: 0.025,
      castSpeed: 1.44,
      returnSpeed: 1.36,
      hookDepth: 94,
      castAttempts: 5,
      coralProtection: 65,
      kelpDuration: 0.40,
      special: 'Sunken Boat curse scenario (5%) always gives positive outcome',
    },
    storageUpgrades: makeStorageUpgrades([34, 54, 72, 94, 122], 325, 9, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(375, 9, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_corsair.png', nativeWidth: 1536, nativeHeight: 1024, rodTipX: 1418, rodTipY: 27 },
  },

  // ──────────────────────────────────────────────────────
  // T10 — The Legend
  // ──────────────────────────────────────────────────────
  {
    id: 't10',
    tier: 10,
    name: 'The Legend',
    captain: 'The Legendary Fisher',
    file: 'the_legend.png',
    unlockCost: 17500,
    minLevel: 81,
    base: {
      storage: 200,
      swingSpeed: 0.028,
      castSpeed: 1.60,
      returnSpeed: 1.52,
      hookDepth: 97,
      castAttempts: 5,
      coralProtection: 75,
      kelpDuration: 0.25,
      special: 'Golden Levels fish value multiplier ×2.5 instead of ×1.5',
    },
    storageUpgrades: makeStorageUpgrades([38, 60, 80, 104, 136], 425, 10, [undefined, 6, 16, 31, 51]),
    rodUpgrades: makeRodUpgrades(490, 10, [undefined, 11, 21, 41, 61]),
    sprite: { file: 'the_legend.png', nativeWidth: 1536, nativeHeight: 1024, rodTipX: 1402, rodTipY: 33 },
  },
];

/** Get effective stats for a vehicle factoring in purchased upgrades */
export function getEffectiveStats(vehicle: VehicleData, stoLevels: number[], rodLevels: number[]) {
  let storage = vehicle.base.storage;
  for (let i = 0; i < stoLevels.length; i++) {
    if (stoLevels[i]) {
      storage += vehicle.storageUpgrades[i].kgBonus;
    }
  }

  let swingSpeed    = vehicle.base.swingSpeed;
  let castSpeed     = vehicle.base.castSpeed;
  let returnSpeed   = vehicle.base.returnSpeed;
  let hookDepth     = vehicle.base.hookDepth;
  let castAttempts  = vehicle.base.castAttempts;
  let coralProt     = vehicle.base.coralProtection;
  let kelpDuration  = vehicle.base.kelpDuration;

  for (let i = 0; i < rodLevels.length; i++) {
    if (rodLevels[i]) {
      const u = vehicle.rodUpgrades[i];
      swingSpeed   += u.swingBonus;
      castSpeed    += u.castBonus;
      returnSpeed  += u.returnBonus;
      hookDepth    += u.depthBonus;
      castAttempts += u.attemptsBonus;
      coralProt    += u.coralBonus;
      kelpDuration -= u.kelpReduction;
    }
  }

  // Special vehicle bonuses
  if (vehicle.id === 't4') returnSpeed *= 1.20;
  if (vehicle.id === 't5') swingSpeed  *= 1.10;

  return { storage, swingSpeed, castSpeed, returnSpeed, hookDepth, castAttempts, coralProtection: Math.min(100, coralProt), kelpDuration: Math.max(0, kelpDuration) };
}

/** Calculate rod tip position on canvas */
export function getRodTipOnCanvas(
  vehicle: VehicleData,
  boatDrawX: number,
  boatDrawY: number,
  displayWidth: number
) {
  const scale = displayWidth / vehicle.sprite.nativeWidth;
  return {
    x: boatDrawX + vehicle.sprite.rodTipX * scale,
    y: boatDrawY + vehicle.sprite.rodTipY * scale,
  };
}
