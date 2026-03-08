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

function makeRodUpgrades(costs: number[], reqs: (number | undefined)[]): RodUpgrade[] {
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
    storageUpgrades: [
      { level: 1, kgBonus: 8,  cost: 20 },
      { level: 2, kgBonus: 13, cost: 45,  reqLevel: 6 },
      { level: 3, kgBonus: 18, cost: 90, reqLevel: 16 },
      { level: 4, kgBonus: 24, cost: 160, reqLevel: 31 },
      { level: 5, kgBonus: 32, cost: 275, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [25, 55, 110, 200, 350],
      [undefined, 11, 21, 41, 61]
    ),
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
    unlockCost: 100,
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
    storageUpgrades: [
      { level: 1, kgBonus: 10, cost: 30 },
      { level: 2, kgBonus: 16, cost: 70, reqLevel: 6 },
      { level: 3, kgBonus: 22, cost: 140, reqLevel: 16 },
      { level: 4, kgBonus: 28, cost: 250, reqLevel: 31 },
      { level: 5, kgBonus: 36, cost: 425, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [38, 85, 165, 300, 525],
      [undefined, 11, 21, 41, 61]
    ),
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
    unlockCost: 367,
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
    storageUpgrades: [
      { level: 1, kgBonus: 13, cost: 45 },
      { level: 2, kgBonus: 20, cost: 100,  reqLevel: 6 },
      { level: 3, kgBonus: 27, cost: 200,  reqLevel: 16 },
      { level: 4, kgBonus: 34, cost: 360,  reqLevel: 31 },
      { level: 5, kgBonus: 43, cost: 625, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [55, 125, 240, 440, 775],
      [undefined, 11, 21, 41, 61]
    ),
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
    unlockCost: 917,
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
    storageUpgrades: [
      { level: 1, kgBonus: 16, cost: 70 },
      { level: 2, kgBonus: 24, cost: 150,  reqLevel: 6 },
      { level: 3, kgBonus: 32, cost: 290,  reqLevel: 16 },
      { level: 4, kgBonus: 42, cost: 525, reqLevel: 31 },
      { level: 5, kgBonus: 54, cost: 900, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [85, 185, 350, 650, 1100],
      [undefined, 11, 21, 41, 61]
    ),
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
    unlockCost: 1667,
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
    storageUpgrades: [
      { level: 1, kgBonus: 18, cost: 100 },
      { level: 2, kgBonus: 28, cost: 210,  reqLevel: 6 },
      { level: 3, kgBonus: 38, cost: 400,  reqLevel: 16 },
      { level: 4, kgBonus: 50, cost: 725, reqLevel: 31 },
      { level: 5, kgBonus: 64, cost: 1250, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [120, 260, 500, 925, 1550],
      [undefined, 11, 21, 41, 61]
    ),
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
    storageUpgrades: [
      { level: 1, kgBonus: 22, cost: 140 },
      { level: 2, kgBonus: 34, cost: 290,  reqLevel: 6 },
      { level: 3, kgBonus: 46, cost: 550, reqLevel: 16 },
      { level: 4, kgBonus: 60, cost: 975, reqLevel: 31 },
      { level: 5, kgBonus: 78, cost: 1650, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [165, 350, 675, 1250, 2100],
      [undefined, 11, 21, 41, 61]
    ),
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
    storageUpgrades: [
      { level: 1, kgBonus: 26, cost: 190 },
      { level: 2, kgBonus: 40, cost: 390,  reqLevel: 6 },
      { level: 3, kgBonus: 54, cost: 725, reqLevel: 16 },
      { level: 4, kgBonus: 70, cost: 1300, reqLevel: 31 },
      { level: 5, kgBonus: 92, cost: 2200, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [220, 460, 900, 1650, 2800],
      [undefined, 11, 21, 41, 61]
    ),
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
    storageUpgrades: [
      { level: 1, kgBonus: 30,  cost: 250 },
      { level: 2, kgBonus: 48,  cost: 500, reqLevel: 6 },
      { level: 3, kgBonus: 64,  cost: 950, reqLevel: 16 },
      { level: 4, kgBonus: 84,  cost: 1700, reqLevel: 31 },
      { level: 5, kgBonus: 110, cost: 2850, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [290, 600, 1150, 2150, 3600],
      [undefined, 11, 21, 41, 61]
    ),
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
    storageUpgrades: [
      { level: 1, kgBonus: 34,  cost: 325 },
      { level: 2, kgBonus: 54,  cost: 650, reqLevel: 6 },
      { level: 3, kgBonus: 72,  cost: 1200, reqLevel: 16 },
      { level: 4, kgBonus: 94,  cost: 2150, reqLevel: 31 },
      { level: 5, kgBonus: 122, cost: 3600, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [375, 775, 1500, 2800, 4650],
      [undefined, 11, 21, 41, 61]
    ),
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
    storageUpgrades: [
      { level: 1, kgBonus: 38,  cost: 425 },
      { level: 2, kgBonus: 60,  cost: 850, reqLevel: 6 },
      { level: 3, kgBonus: 80,  cost: 1550, reqLevel: 16 },
      { level: 4, kgBonus: 104, cost: 2750, reqLevel: 31 },
      { level: 5, kgBonus: 136, cost: 4600, reqLevel: 51 },
    ],
    rodUpgrades: makeRodUpgrades(
      [490, 1000, 1950, 3600, 6000],
      [undefined, 11, 21, 41, 61]
    ),
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
