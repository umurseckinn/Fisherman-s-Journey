import { type GameState, type Entity, type FishClass, type CurseType, OBJECT_MATRIX } from "./types";
import { SpriteManager, ASSETS } from "./SpriteManager";
import { TutorialLevelManager } from "./TutorialManager";
import { GameEffects } from "./GameEffects";
import { VEHICLES, getRodTipOnCanvas, getEffectiveStats, type VehicleData } from "./vehicles";
import { addSessionEarning, updateMaxLevelReached, getStoFlags, getRodFlags, getActiveVehicleId, type RunScoreBreakdown, submitPersonalBest, markTutorialCatch } from "./storage";
import { LEVEL_NAMES } from "./levelNames";

export const CANVAS_WIDTH = 450;
export const CANVAS_HEIGHT = 800;
export const SEA_LEVEL_Y = CANVAS_HEIGHT * 0.25;
export const FISH_ZONE_TOP = SEA_LEVEL_Y + 60; // Hull avoidance (User request 1)

const DEFAULT_FLEE = { radius: 0, power: 0 };

const FLEE_CONFIG: Record<FishClass, { radius: number; power: number }> = {
  bubble: { radius: 0, power: 0 },
  sakura: { radius: 40, power: 0.4 },
  zap: { radius: 0, power: 0 },
  candy: { radius: 55, power: 0.6 },
  moon: { radius: 70, power: 0.8 },
  lava: { radius: 65, power: 1.0 },
  tide: { radius: 0, power: 0 },
  leaf: { radius: 80, power: 0.7 },
  crystal: { radius: 90, power: 1.2 },
  galaxy: { radius: 100, power: 0 },
  mushroom: { radius: 85, power: 1.1 },
  king: { radius: 110, power: 0 },
  coral: { radius: 0, power: 0 },
  sea_kelp: { radius: 0, power: 0 },
  sea_kelp_horizontal: { radius: 0, power: 0 },
  sea_rock: { radius: 0, power: 0 },
  sea_rock_large: { radius: 0, power: 0 },
  gold_doubloon: { radius: 0, power: 0 },
  whirlpool: { radius: 0, power: 0 },
  sunken_boat: { radius: 0, power: 0 },
  shark_skeleton: { radius: 0, power: 0 },
  env_bubbles: { radius: 0, power: 0 },
  anchor: { radius: 0, power: 0 },
  shell: { radius: 0, power: 0 },
};

export const LEVEL_CONFIG: Record<number, {
  duration: number;
  region: number;
  fuelCost: number;
  storageCapacity?: number;
  seaColor: string;
  skyColor: string;
  weatherWeights: Record<string, number>;
  fish: FishClass[];
  obstacles: { sea_kelp: number; sea_rock: number; coral: number; anchor: number };
  dynamic: FishClass[];
  curse?: CurseType;  // Aktif lanet (undefined = 'none')
}> = {
  // ═══════════════════════════════════════════════
  // REGION 1: Starter Bay (L1–L20)
  // ═══════════════════════════════════════════════
  1: { duration: 50, region: 1, fuelCost: 25, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#87CEEB', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura'], obstacles: { sea_kelp: 0, sea_rock: 0, coral: 0, anchor: 0 }, dynamic: ['shell'] },
  2: { duration: 50, region: 1, fuelCost: 28, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#87CEEB', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap'], obstacles: { sea_kelp: 0, sea_rock: 0, coral: 0, anchor: 0 }, dynamic: ['shell'] },
  3: { duration: 50, region: 1, fuelCost: 32, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#87CEEB', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap'], obstacles: { sea_kelp: 1, sea_rock: 0, coral: 0, anchor: 0 }, dynamic: ['shell'] },
  4: { duration: 49, region: 1, fuelCost: 36, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#87CEEB', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy'], obstacles: { sea_kelp: 1, sea_rock: 1, coral: 0, anchor: 0 }, dynamic: ['shell'] },
  5: { duration: 49, region: 1, fuelCost: 42, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#87CEEB', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy'], obstacles: { sea_kelp: 1, sea_rock: 1, coral: 0, anchor: 0 }, dynamic: ['shell', 'gold_doubloon'] },
  6: { duration: 47, region: 1, fuelCost: 48, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#87CEEB', weatherWeights: { sunny: 0.6, cloudy: 0.4 }, fish: ['bubble', 'sakura', 'zap', 'candy'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 0, anchor: 0 }, dynamic: ['shell'] },
  7: { duration: 52, region: 1, fuelCost: 44, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#abd8eaff', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy'], obstacles: { sea_kelp: 1, sea_rock: 0, coral: 0, anchor: 0 }, dynamic: ['shell', 'gold_doubloon'] },
  8: { duration: 48, region: 1, fuelCost: 55, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#81D4FA', weatherWeights: { sunny: 0.5, cloudy: 0.5 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 0, anchor: 0 }, dynamic: ['shell', 'gold_doubloon'] },
  9: { duration: 46, region: 1, fuelCost: 62, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#81D4FA', weatherWeights: { sunny: 0.5, cloudy: 0.5 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon'], obstacles: { sea_kelp: 2, sea_rock: 2, coral: 0, anchor: 0 }, dynamic: ['shell'] },
  10: { duration: 52, region: 1, fuelCost: 58, storageCapacity: 10, seaColor: '#29B6F6', skyColor: '#87CEEB', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 0, anchor: 0 }, dynamic: ['shell', 'gold_doubloon'] }, // BOSS — golden x1.5
  11: { duration: 48, region: 1, fuelCost: 68, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#81D4FA', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 0, anchor: 1 }, dynamic: ['shell', 'sunken_boat'] },
  12: { duration: 47, region: 1, fuelCost: 72, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#81D4FA', weatherWeights: { sunny: 0.6, cloudy: 0.4 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 0, anchor: 1 }, dynamic: ['shell', 'sunken_boat'] },
  13: { duration: 53, region: 1, fuelCost: 62, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#81D4FA', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava'], obstacles: { sea_kelp: 1, sea_rock: 1, coral: 0, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'] },
  14: { duration: 46, region: 1, fuelCost: 78, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#B0BEC5', weatherWeights: { rainy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide'], obstacles: { sea_kelp: 2, sea_rock: 2, coral: 0, anchor: 1 }, dynamic: ['shell'] },
  15: { duration: 46, region: 1, fuelCost: 82, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#81D4FA', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 2, anchor: 1 }, dynamic: ['shell'] },
  16: { duration: 48, region: 1, fuelCost: 86, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#78909C', weatherWeights: { sunny: 0.4, cloudy: 0.6 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf'], obstacles: { sea_kelp: 3, sea_rock: 1, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon'] },
  17: { duration: 47, region: 1, fuelCost: 90, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#78909C', weatherWeights: { sunny: 0.4, cloudy: 0.6 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 1, anchor: 0 }, dynamic: ['shell', 'sunken_boat', 'shark_skeleton'] },
  18: { duration: 47, region: 1, fuelCost: 94, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#78909C', weatherWeights: { rainy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  19: { duration: 45, region: 1, fuelCost: 98, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#546E7A', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 1 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  20: { duration: 58, region: 1, fuelCost: 120, storageCapacity: 10, seaColor: '#26C6DA', skyColor: '#546E7A', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal'], obstacles: { sea_kelp: 4, sea_rock: 2, coral: 2, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // BOSS

  // ═══════════════════════════════════════════════
  // REGION 2: Coral Islands (L21–L40)
  // ═══════════════════════════════════════════════
  21: { duration: 48, region: 2, fuelCost: 160, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#FFF9C4', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon'] },
  22: { duration: 47, region: 2, fuelCost: 163, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#FFF9C4', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 0 }, dynamic: ['shell', 'sunken_boat'] },
  23: { duration: 43, region: 2, fuelCost: 166, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#B0BEC5', weatherWeights: { rainy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal'], obstacles: { sea_kelp: 2, sea_rock: 2, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon'] },
  24: { duration: 54, region: 2, fuelCost: 152, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#FFF9C4', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 0, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'] }, // Nefes
  25: { duration: 48, region: 2, fuelCost: 170, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#CFD8DC', weatherWeights: { sunny: 0.4, cloudy: 0.6 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 1 }, dynamic: ['shell', 'gold_doubloon', 'shark_skeleton'] },
  26: { duration: 47, region: 2, fuelCost: 173, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#CFD8DC', weatherWeights: { sunny: 0.4, cloudy: 0.6 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 0 }, dynamic: ['shell', 'sunken_boat', 'shark_skeleton'] },
  27: { duration: 47, region: 2, fuelCost: 176, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#B0BEC5', weatherWeights: { rainy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool'] },
  28: { duration: 46, region: 2, fuelCost: 179, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#FFF9C4', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 3, anchor: 1 }, dynamic: ['shell', 'sunken_boat'] },
  29: { duration: 54, region: 2, fuelCost: 160, storageCapacity: 10, seaColor: '#0288D1', skyColor: '#e4db86ff', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'] }, // Nefes
  30: { duration: 58, region: 2, fuelCost: 200, storageCapacity: 10, seaColor: '#0277BD', skyColor: '#546E7A', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom'], obstacles: { sea_kelp: 4, sea_rock: 2, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // BOSS

  // ═══════════════════════════════════════════════
  // REGION 3: Deep Blue (L31–L50)
  // ═══════════════════════════════════════════════
  31: { duration: 48, region: 3, fuelCost: 210, storageCapacity: 10, seaColor: '#01579B', skyColor: '#546E7A', weatherWeights: { sunny: 0.3, cloudy: 0.7 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  32: { duration: 47, region: 3, fuelCost: 214, storageCapacity: 10, seaColor: '#0a5995ff', skyColor: '#546E7A', weatherWeights: { sunny: 0.3, cloudy: 0.7 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 1 }, dynamic: ['shell', 'gold_doubloon'] },
  33: { duration: 44, region: 3, fuelCost: 217, storageCapacity: 10, seaColor: '#01579B', skyColor: '#37474F', weatherWeights: { rainy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom'], obstacles: { sea_kelp: 4, sea_rock: 2, coral: 2, anchor: 0 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  34: { duration: 54, region: 3, fuelCost: 198, storageCapacity: 10, seaColor: '#01579B', skyColor: '#78909C', weatherWeights: { sunny: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom'], obstacles: { sea_kelp: 2, sea_rock: 1, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'] }, // Nefes
  35: { duration: 48, region: 3, fuelCost: 220, storageCapacity: 10, seaColor: '#01579B', skyColor: '#546E7A', weatherWeights: { sunny: 0.3, cloudy: 0.7 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 2, coral: 2, anchor: 1 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  36: { duration: 46, region: 3, fuelCost: 223, storageCapacity: 10, seaColor: '#01579B', skyColor: '#37474F', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 2 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  37: { duration: 47, region: 3, fuelCost: 226, storageCapacity: 10, seaColor: '#01579B', skyColor: '#546E7A', weatherWeights: { sunny: 0.3, cloudy: 0.7 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  38: { duration: 46, region: 3, fuelCost: 229, storageCapacity: 10, seaColor: '#01579B', skyColor: '#37474F', weatherWeights: { rainy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 2, coral: 3, anchor: 1 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  39: { duration: 44, region: 3, fuelCost: 232, storageCapacity: 10, seaColor: '#01579B', skyColor: '#263238', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  40: { duration: 60, region: 3, fuelCost: 260, storageCapacity: 10, seaColor: '#0D47A1', skyColor: '#1A237E', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 3, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // BOSS

  // ═══════════════════════════════════════════════
  // REGION 4: Storm Pass (L41–L50)
  // ═══════════════════════════════════════════════
  41: { duration: 48, region: 4, fuelCost: 270, storageCapacity: 10, seaColor: '#112942ff', skyColor: '#1A237E', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  42: { duration: 47, region: 4, fuelCost: 273, storageCapacity: 10, seaColor: '#0D2137', skyColor: '#1A237E', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 2 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  43: { duration: 46, region: 4, fuelCost: 276, storageCapacity: 10, seaColor: '#0D2137', skyColor: '#1A237E', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 3, anchor: 1 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  44: { duration: 54, region: 4, fuelCost: 255, storageCapacity: 10, seaColor: '#0D2137', skyColor: '#263238', weatherWeights: { sunny: 0.2, cloudy: 0.8 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'] }, // Nefes
  45: { duration: 48, region: 4, fuelCost: 280, storageCapacity: 10, seaColor: '#0D2137', skyColor: '#1A237E', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 3, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  46: { duration: 46, region: 4, fuelCost: 283, storageCapacity: 10, seaColor: '#0D2137', skyColor: '#1A237E', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 4, coral: 3, anchor: 2 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  47: { duration: 47, region: 4, fuelCost: 286, storageCapacity: 10, seaColor: '#0D2137', skyColor: '#263238', weatherWeights: { sunny: 0.1, cloudy: 0.9 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  48: { duration: 46, region: 4, fuelCost: 289, storageCapacity: 10, seaColor: '#0D2137', skyColor: '#1A237E', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 3, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  49: { duration: 44, region: 4, fuelCost: 292, storageCapacity: 10, seaColor: '#0D2137', skyColor: '#1A237E', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 4, coral: 4, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  50: { duration: 62, region: 4, fuelCost: 320, storageCapacity: 10, seaColor: '#0A1929', skyColor: '#0D1B2A', weatherWeights: { stormy: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 4, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // BOSS

  // ═══════════════════════════════════════════════
  // REGION 5: Aurora Night (L51–L60)
  // ═══════════════════════════════════════════════
  51: { duration: 50, region: 5, fuelCost: 330, seaColor: '#120040', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 4, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  52: { duration: 48, region: 5, fuelCost: 333, seaColor: '#120040', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 4, coral: 3, anchor: 2 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  53: { duration: 55, region: 5, fuelCost: 315, seaColor: '#120040', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'] }, // Nefes
  54: { duration: 48, region: 5, fuelCost: 336, seaColor: '#120040', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 4, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  55: { duration: 47, region: 5, fuelCost: 339, seaColor: '#241157ff', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 3, coral: 5, anchor: 2 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  56: { duration: 47, region: 5, fuelCost: 342, seaColor: '#120040', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 5, sea_rock: 4, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  57: { duration: 46, region: 5, fuelCost: 345, seaColor: '#120040', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 4, coral: 3, anchor: 3 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  58: { duration: 46, region: 5, fuelCost: 348, seaColor: '#120040', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 4, coral: 4, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  59: { duration: 45, region: 5, fuelCost: 352, seaColor: '#120040', skyColor: '#0D0028', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  60: { duration: 65, region: 5, fuelCost: 380, seaColor: '#1A0040', skyColor: '#120030', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // BOSS

  // ═══════════════════════════════════════════════
  // REGION 6: Crimson Night (L61–L70)
  // ═══════════════════════════════════════════════
  61: { duration: 50, region: 6, fuelCost: 390, seaColor: '#2D0010', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 4, coral: 4, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  62: { duration: 48, region: 6, fuelCost: 393, seaColor: '#2D0010', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 4, coral: 4, anchor: 2 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'heavy_waters' },
  63: { duration: 48, region: 6, fuelCost: 396, seaColor: '#4a081fff', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 4, coral: 3, anchor: 2 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'], curse: 'fast_current' },
  64: { duration: 55, region: 6, fuelCost: 375, seaColor: '#2D0010', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'], curse: 'none' },
  65: { duration: 48, region: 6, fuelCost: 400, seaColor: '#2D0010', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'], curse: 'blind_spot' },
  66: { duration: 48, region: 6, fuelCost: 403, seaColor: '#2D0010', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 4, coral: 4, anchor: 2 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'reverse_current' },
  67: { duration: 47, region: 6, fuelCost: 406, seaColor: '#2D0010', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'double_damage' },
  68: { duration: 55, region: 6, fuelCost: 385, seaColor: '#2D0010', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 3, sea_rock: 2, coral: 1, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'], curse: 'none' },
  69: { duration: 47, region: 6, fuelCost: 410, seaColor: '#2D0010', skyColor: '#1A0008', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'economic_crisis' },
  70: { duration: 68, region: 6, fuelCost: 430, seaColor: '#3D0018', skyColor: '#250010', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 8, sea_rock: 5, coral: 5, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // BOSS

  // ═══════════════════════════════════════════════
  // REGION 7: Neon Night / Chaos Dimension (L71–L80)
  // ═══════════════════════════════════════════════
  71: { duration: 50, region: 7, fuelCost: 440, seaColor: '#475656ff', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 6, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'none' },
  72: { duration: 48, region: 7, fuelCost: 443, seaColor: '#001A1A', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'chain_reaction' },
  73: { duration: 48, region: 7, fuelCost: 446, seaColor: '#001A1A', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'], curse: 'invisible_fish' },
  74: { duration: 55, region: 7, fuelCost: 420, seaColor: '#001A1A', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'], curse: 'none' },
  75: { duration: 48, region: 7, fuelCost: 450, seaColor: '#001A1A', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 5, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'], curse: 'countdown' },
  76: { duration: 48, region: 7, fuelCost: 453, seaColor: '#001A1A', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'reverse_market' },
  77: { duration: 47, region: 7, fuelCost: 456, seaColor: '#001A1A', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'skeleton_army' },
  78: { duration: 55, region: 7, fuelCost: 430, seaColor: '#001A1A', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'none' },
  79: { duration: 46, region: 7, fuelCost: 458, seaColor: '#001A1A', skyColor: '#001226', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 8, sea_rock: 5, coral: 5, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'random_curse' },
  80: { duration: 70, region: 7, fuelCost: 480, seaColor: '#002020', skyColor: '#001830', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 8, sea_rock: 6, coral: 5, anchor: 4 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // BOSS x2.0

  // ═══════════════════════════════════════════════
  // REGION 8: Golden Night / Legend Run (L81–L100)
  // ═══════════════════════════════════════════════
  81: { duration: 50, region: 8, fuelCost: 490, seaColor: '#67551cff', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 5, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  82: { duration: 48, region: 8, fuelCost: 493, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 5, anchor: 3 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'combo_1' },
  83: { duration: 47, region: 8, fuelCost: 496, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 5, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'], curse: 'combo_2' },
  84: { duration: 55, region: 8, fuelCost: 470, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'] }, // Nefes
  85: { duration: 35, region: 8, fuelCost: 500, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] }, // Lanet: 35sn süre
  86: { duration: 48, region: 8, fuelCost: 503, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 5, coral: 4, anchor: 3 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'reverse_weight' }, // Lanet: Ters Gösterge
  87: { duration: 47, region: 8, fuelCost: 506, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 7, sea_rock: 6, coral: 5, anchor: 3 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'fish_escape' },
  88: { duration: 54, region: 8, fuelCost: 480, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'none' },
  89: { duration: 46, region: 8, fuelCost: 508, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 8, sea_rock: 6, coral: 5, anchor: 4 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'combo_3' },
  90: { duration: 72, region: 8, fuelCost: 530, seaColor: '#201A00', skyColor: '#150F00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 9, sea_rock: 6, coral: 6, anchor: 4 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // BOSS x2.0
  91: { duration: 50, region: 8, fuelCost: 540, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 8, sea_rock: 6, coral: 5, anchor: 4 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] },
  92: { duration: 48, region: 8, fuelCost: 543, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 8, sea_rock: 6, coral: 5, anchor: 4 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'time_bomb' },
  93: { duration: 47, region: 8, fuelCost: 546, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 8, sea_rock: 6, coral: 6, anchor: 4 }, dynamic: ['shell', 'gold_doubloon', 'whirlpool', 'shark_skeleton'], curse: 'dark_matter' },
  94: { duration: 55, region: 8, fuelCost: 520, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 4, sea_rock: 3, coral: 2, anchor: 0 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat'], curse: 'none' },
  95: { duration: 47, region: 8, fuelCost: 550, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 9, sea_rock: 6, coral: 6, anchor: 4 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'final_1' },
  96: { duration: 46, region: 8, fuelCost: 553, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 9, sea_rock: 6, coral: 6, anchor: 4 }, dynamic: ['shell', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'final_2' },
  97: { duration: 46, region: 8, fuelCost: 556, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 9, sea_rock: 7, coral: 6, anchor: 5 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'final_3' },
  98: { duration: 45, region: 8, fuelCost: 558, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 9, sea_rock: 7, coral: 6, anchor: 5 }, dynamic: ['shell', 'sunken_boat', 'gold_doubloon', 'whirlpool', 'shark_skeleton'] },
  99: { duration: 48, region: 8, fuelCost: 560, seaColor: '#1A1400', skyColor: '#0D0D00', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 9, sea_rock: 7, coral: 7, anchor: 5 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'], curse: 'one_chance' },
  100: { duration: 75, region: 8, fuelCost: 600, seaColor: '#252000', skyColor: '#1A1800', weatherWeights: { magic: 1 }, fish: ['bubble', 'sakura', 'zap', 'candy', 'moon', 'lava', 'tide', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'], obstacles: { sea_kelp: 10, sea_rock: 7, coral: 7, anchor: 5 }, dynamic: ['shell', 'gold_doubloon', 'sunken_boat', 'whirlpool', 'shark_skeleton'] }, // FINAL BOSS x2.5
};

Object.entries(LEVEL_CONFIG).forEach(([levelKey, config]) => {
  const level = Number(levelKey);
  const blockIndex = Math.floor((level - 1) / 5);
  const blockStart = blockIndex * 5 + 1;
  const progress = (level - blockStart) / 4;
  const regionIndex = Math.floor((level - 1) / 20);
  const saw = 0.85 + progress * 0.3;
  const region = 1 + regionIndex * 0.12;
  const block = 1 + blockIndex * 0.02;
  const multiplier = saw * region * block;
  config.fuelCost = Math.max(1, Math.round(config.fuelCost * 1.6 * multiplier));
});

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private bgCtx: CanvasRenderingContext2D;
  private whirlpoolEl: HTMLImageElement | null = null;
  private state: GameState;
  private lastFrameTime: number = 0;
  private timers: Record<string, number> = {};
  private onGameOver: (score: number, level: number, reason?: string) => void;
  private onScoreUpdate: (score: number) => void;
  private onEarning: (amount: number) => void;
  private onLevelComplete: (level: number) => void;
  private onFishCaught: (fish: Entity) => void;
  private onBoosterUsed: (type: 'harpoon' | 'net' | 'tnt' | 'anchor') => void;
  private onPermanentCoinsUpdate?: (pCoins: number) => void;
  // Active vehicle for rod tip + sprite
  private activeVehicleId: string = 't1';
  private activeVehicleData: VehicleData | null = null;
  // Run score tracking
  public totalCoinsEarned: number = 0;
  public maxLevelReachedThisRun: number = 1;
  public kingFishCaughtThisRun: number = 0;
  private arrivalProgress: number = 0;
  private isArriving: boolean = false;
  private isSinking: boolean = false;
  private sinkProgress: number = 0;
  private spriteManager: SpriteManager;
  private assetsLoaded: boolean = false;
  private whirlpoolCenter: { x: number; y: number } | null = null;
  private whirlpoolAngle: number = 0;
  private whirlpoolTurns: number = 0;
  private whirlpoolRadius: number = 0;
  private hookBreakDuration: number = 3500;
  private lastSnagType: 'anchor' | 'kelp' | 'rock' | null = null;
  private lastSpawnedType: FishClass | null = null;
  public effects: GameEffects;
  private wasSubmerged: boolean = false;
  private hookLaunchMs: number = 0; // timer for launch animation
  private isPointerDown: boolean = false;
  private anchorVisualState: 'inactive' | 'dropping' | 'resting' | 'drifting' = 'inactive';
  private anchorVisualX: number = 0;
  private anchorVisualY: number = 0;
  private anchorDropElapsed: number = 0;
  private anchorDriftSpeed: number = 0;
  // Background layer optimizasyonu
  private backgroundDirty: boolean = true;
  private levelSpawnWeights: Record<number, Partial<Record<FishClass, number>>> | null = null;
  private levelObjectWeights: Record<number, Partial<Record<FishClass, number>>> | null = null;
  private activeWhirlpool: Entity | null = null;
  private perfEnabled: boolean = false;
  private tutorialManager: TutorialLevelManager | null = null;
  private tutorialFrozen: boolean = false;
  private tutorialAnchorUsed: boolean = false;
  private tutorialArrivalTimeout: number | null = null;
  private perfStats = {
    enabled: false,
    fps: 0,
    avgFrameMs: 0,
    avgUpdateMs: 0,
    avgDrawMs: 0,
    fishCount: 0,
    level: 0
  };
  private perfAccumFrame = 0;
  private perfAccumUpdate = 0;
  private perfAccumDraw = 0;
  private perfFrames = 0;
  private perfLastReport = 0;

  constructor(
    ctx: CanvasRenderingContext2D,
    bgCtx: CanvasRenderingContext2D,
    whirlpoolEl: HTMLImageElement | null,
    initialState: GameState,
    callbacks: {
      onGameOver: (score: number, level: number, reason?: string) => void;
      onScoreUpdate: (score: number) => void;
      onEarning: (amount: number) => void;
      onLevelComplete: (level: number) => void;
      onFishCaught: (fish: Entity) => void;
      onBoosterUsed: (type: 'harpoon' | 'net' | 'tnt' | 'anchor') => void;
    }
  ) {
    this.ctx = ctx;
    this.bgCtx = bgCtx;
    this.whirlpoolEl = whirlpoolEl;
    this.state = initialState;
    this.onGameOver = callbacks.onGameOver;
    this.onScoreUpdate = callbacks.onScoreUpdate;
    this.onEarning = callbacks.onEarning;
    this.onLevelComplete = callbacks.onLevelComplete;
    this.onFishCaught = callbacks.onFishCaught;
    this.onBoosterUsed = callbacks.onBoosterUsed;

    this.spriteManager = new SpriteManager(() => {
      this.assetsLoaded = true;
      this.backgroundDirty = true; // sprites loaded — force BG redraw
    });
    this.spriteManager.loadImages(ASSETS);
    this.effects = new GameEffects(CANVAS_WIDTH, CANVAS_HEIGHT);
    if (typeof window !== 'undefined') {
      this.perfEnabled = new URLSearchParams(window.location.search).has('perf');
      this.perfStats.enabled = this.perfEnabled;
    }
  }

  /** Mark background as needing redraw (call on level change, weather change, etc.) */
  private invalidateBackground() {
    this.backgroundDirty = true;
  }

  start() {
    this.state.isPlaying = true;
    this.isArriving = false;
    this.arrivalProgress = 0;
    this.isSinking = false;
    this.sinkProgress = 0;
    this.state.lavaBurnMs = 0;
    this.state.buoyancyOffset = 0;
    this.state.buoyancyOffsetMs = 0;
    this.state.weather = this.pickWeather();
    const config = LEVEL_CONFIG[this.state.level];
    if (config) {
      this.state.timeRemaining = config.duration;
      this.state.fuelCost = config.fuelCost;
      this.state.region = config.region;
      this.state.activeCurse = config.curse || 'none';
      this.state.curseTimerMs = 0;
    }
    this.state.startTimerMs = 750;
    const storedVehicleId = getActiveVehicleId();
    const activeVehicle = VEHICLES.find(vehicle => vehicle.id === storedVehicleId) ?? VEHICLES[0];
    this.activeVehicleId = activeVehicle.id;
    this.activeVehicleData = activeVehicle;
    const ownedSto = getStoFlags(activeVehicle.id);
    const ownedRod = getRodFlags(activeVehicle.id);
    const stats = getEffectiveStats(activeVehicle, ownedSto.map(Number), ownedRod.map(Number));
    const derivedRodLevel = Math.max(1, ownedRod.filter(Boolean).length + 1);
    const derivedBoatLevel = Math.max(1, ownedSto.filter(Boolean).length + 1);
    this.state.upgrades = {
      ...this.state.upgrades,
      rodLevel: derivedRodLevel,
      boatLevel: derivedBoatLevel,
      storageCapacity: stats.storage,
      swingSpeed: stats.swingSpeed,
      castSpeed: stats.castSpeed,
      returnSpeed: stats.returnSpeed,
      hookDepth: stats.hookDepth,
      castAttempts: stats.castAttempts,
      coralProtection: stats.coralProtection,
      kelpDuration: stats.kelpDuration,
    };
    this.state.maxHookAttempts = stats.castAttempts;

    // 'one_chance' curse: Start with only 1 hook attempt
    if (this.state.activeCurse === 'one_chance') {
      this.state.hookAttempts = 1;
    } else {
      this.state.hookAttempts = this.getRodStats().maxAttempts;
    }
    // Boss levellar — different multipliers:
    // L10, L20, L30, L40, L50, L60, L70: x1.5
    // L80, L90: x2.0
    // L100: x2.5
    const isBossLevel = this.state.level % 10 === 0;
    if (this.state.level === 80 || this.state.level === 90) {
      this.state.valueMultiplier = 2.0;
    } else if (this.state.level === 100) {
      this.state.valueMultiplier = 2.5;
    } else if (isBossLevel) {
      this.state.valueMultiplier = 1.5;
    } else {
      this.state.valueMultiplier = 1.0;
    }
    if (this.activeVehicleId === 't10' && isBossLevel && this.state.valueMultiplier === 1.5) {
      this.state.valueMultiplier = 2.5;
    }
    updateMaxLevelReached(this.state.level);
    // Force reset hook state and angle/direction on start to prevent stuck oscillation
    this.state.hook.state = 'idle';
    this.state.hook.length = 0;
    this.state.hook.angle = Math.PI / 2; // Start from middle
    this.state.hook.direction = 1;
    const hookPivot = this.getHookPivotPosition();
    this.state.hook.x = hookPivot.x;
    this.state.hook.y = hookPivot.y;
    this.hookLaunchMs = 0;
    this.wasSubmerged = false;
    this.backgroundDirty = true; // Force background redraw at start
    this.tutorialFrozen = false;
    this.tutorialAnchorUsed = false;
    if (this.tutorialArrivalTimeout !== null) {
      window.clearTimeout(this.tutorialArrivalTimeout);
      this.tutorialArrivalTimeout = null;
    }
    this.tutorialManager = this.state.level === 1 ? new TutorialLevelManager(this) : null;
    this.seedStaticObstacles();
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  public stop() {
    this.state.isPlaying = false;
  }

  public pause() {
    this.state.isPaused = true;
  }

  public resume() {
    this.state.isPaused = false;
    this.lastFrameTime = performance.now(); // Reset frame time to avoid huge jump
  }

  public getState() {
    return this.state;
  }

  public getTutorialState() {
    return this.tutorialManager?.getState() ?? null;
  }

  public handleTutorialInteraction(action: string) {
    this.tutorialManager?.handleInteraction(action);
  }

  public setTutorialFreeze(isFrozen: boolean) {
    this.tutorialFrozen = isFrozen;
    if (isFrozen) {
      const hook = this.state.hook;
      if (hook.caughtEntity) {
        const caught = hook.caughtEntity;
        const storeCatch = this.state.anchorEffectTimerMs <= 0;
        if (caught.type === 'sunken_boat') {
          this.handleSunkenBoat(caught, storeCatch);
        } else if (caught.type === 'shell') {
          this.handleShell(caught, storeCatch);
        } else {
          this.handleStandardCatch(caught, false, storeCatch);
        }
      }
      hook.state = 'idle';
      hook.length = 0;
      hook.caughtEntity = null;
      const pivot = this.getHookPivotPosition();
      hook.x = pivot.x;
      hook.y = pivot.y;
      this.wasSubmerged = false;
      this.hookLaunchMs = 0;
    }
  }

  public spawnTutorialFish(type: FishClass, count: number, closeTogether: boolean = false) {
    const ids: number[] = [];
    const spacing = 45;
    const baseX = CANVAS_WIDTH + 80;
    const baseY = closeTogether ? this.getTutorialSpawnY(type) : undefined;
    for (let i = 0; i < count; i++) {
      const offsetIndex = count > 1 ? i - (count - 1) / 2 : 0;
      const x = closeTogether
        ? baseX + offsetIndex * spacing
        : CANVAS_WIDTH + 60 + Math.random() * 120;
      const y = baseY ?? this.getTutorialSpawnY(type);
      const entity = this.buildTutorialEntity(type, x, y);
      this.state.fishes.push(entity);
      ids.push(entity.id);
    }
    return ids;
  }

  public spawnTutorialFishAt(type: FishClass, x: number, y: number) {
    const entity = this.buildTutorialEntity(type, x, y);
    this.state.fishes.push(entity);
    return entity.id;
  }

  public getHookPivotPositionOnCanvas() {
    return this.getHookPivotPosition();
  }

  public setTutorialTntAim(x: number, y: number) {
    const gridSize = 240;
    const half = gridSize / 2;
    const clampedX = Math.min(CANVAS_WIDTH - half, Math.max(half, x));
    const clampedY = Math.min(CANVAS_HEIGHT - half, Math.max(SEA_LEVEL_Y + half, y));
    this.state.hook.state = 'tnt_aiming';
    this.state.hook.targetX = clampedX;
    this.state.hook.targetY = clampedY;
  }

  public scheduleTutorialArrival(delayMs: number) {
    if (this.tutorialArrivalTimeout !== null) {
      window.clearTimeout(this.tutorialArrivalTimeout);
    }
    this.tutorialArrivalTimeout = window.setTimeout(() => {
      this.tutorialArrivalTimeout = null;
      if (!this.state.isPlaying || this.isArriving) return;
      this.isArriving = true;
      this.state.hook.state = 'idle';
      this.arrivalProgress = 0;
    }, delayMs);
  }

  public isPerfEnabled() {
    return this.perfEnabled;
  }

  public getPerfStats() {
    return this.perfStats;
  }

  private recordPerf(frameMs: number, updateMs: number, drawMs: number, timestamp: number) {
    if (!this.perfEnabled) return;
    this.perfAccumFrame += frameMs;
    this.perfAccumUpdate += updateMs;
    this.perfAccumDraw += drawMs;
    this.perfFrames += 1;
    const elapsed = timestamp - this.perfLastReport;
    if (elapsed >= 1000) {
      const denom = this.perfFrames || 1;
      this.perfStats.fps = Math.round((this.perfFrames * 1000) / elapsed);
      this.perfStats.avgFrameMs = Number((this.perfAccumFrame / denom).toFixed(2));
      this.perfStats.avgUpdateMs = Number((this.perfAccumUpdate / denom).toFixed(2));
      this.perfStats.avgDrawMs = Number((this.perfAccumDraw / denom).toFixed(2));
      this.perfStats.fishCount = this.state.fishes.length;
      this.perfStats.level = this.state.level;
      this.perfAccumFrame = 0;
      this.perfAccumUpdate = 0;
      this.perfAccumDraw = 0;
      this.perfFrames = 0;
      this.perfLastReport = timestamp;
    }
  }

  /** Unified input handler for clicks/taps (kept for backwards compatibility on fast taps) */
  public handleInput(cx: number = CANVAS_WIDTH / 2, cy: number = SEA_LEVEL_Y + 100) {
    if (this.state.isPaused || this.state.hookBrokenMs > 0) return;

    this.handlePointerDown(cx, cy);
    this.handlePointerUp(cx, cy);
  }

  public handlePointerDown(cx: number, cy: number) {
    if (this.state.isPaused || this.state.hookBrokenMs > 0) {
      this.isPointerDown = false;
      return;
    }
    if (this.tutorialFrozen && !this.state.activeBooster) {
      this.isPointerDown = false;
      return;
    }

    // 1. Check for anchor snag
    if (this.state.anchorSnagMs > 0 && this.lastSnagType === 'anchor') {
      this.state.anchorSnagMs = 500;
      this.isPointerDown = true;
      return;
    }
    this.isPointerDown = true;

    const booster = this.state.activeBooster;
    const isIdle = this.state.hook.state === 'idle';

    if (booster === 'harpoon' && isIdle) {
      this.state.hook.state = 'aiming';
      this.handlePointerMove(cx, cy);
      return;
    }

    if (booster === 'tnt' && isIdle) {
      this.state.hook.state = 'tnt_aiming';
      this.state.hook.targetX = Math.max(0, Math.min(CANVAS_WIDTH, cx));
      this.state.hook.targetY = Math.max(SEA_LEVEL_Y, Math.min(CANVAS_HEIGHT, cy));
      return;
    }

    // 2. Handle non-aiming Boosters on tap
    if (booster && isIdle) {

      if (booster === 'net') {
        this.state.hook.state = booster;
        this.state.hook.targetX = cx;
        this.state.hook.targetY = cy;
        const pivot = this.getHookPivotPosition();
        const dx = cx - pivot.x;
        const dy = cy - pivot.y;
        this.state.hook.angle = Math.atan2(dy, -dx);
        this.onBoosterUsed(booster);
        return;
      }
    }
  }

  public handlePointerMove(cx: number, cy: number) {
    if (this.state.isPaused || this.state.hookBrokenMs > 0) return;
    if (this.tutorialFrozen && this.state.hook.state !== 'aiming' && this.state.hook.state !== 'tnt_aiming') return;

    if (this.state.hook.state === 'aiming') {
      const pivot = this.getHookPivotPosition();
      const dx = cx - pivot.x;
      const dy = cy - pivot.y;

      // Clamp angle downwards (between 0 and PI)
      let angle = Math.atan2(dy, -dx);
      if (angle < 0) {
        // If pointing up-right, clamp to 0 (right)
        // If pointing up-left, clamp to PI (left)
        angle = dx > 0 ? 0 : Math.PI;
      }
      this.state.hook.angle = angle;
    } else if (this.state.hook.state === 'tnt_aiming') {
      this.state.hook.targetX = Math.max(0, Math.min(CANVAS_WIDTH, cx));
      this.state.hook.targetY = Math.max(SEA_LEVEL_Y, Math.min(CANVAS_HEIGHT, cy));
    }
  }

  public handlePointerUp(cx: number, cy: number) {
    this.isPointerDown = false;
    if (this.state.isPaused || this.state.hookBrokenMs > 0) return;
    if (this.tutorialFrozen && !this.state.activeBooster && this.state.hook.state === 'idle') return;

    if (this.state.hook.state === 'aiming') {
      const tutorial = this.tutorialManager?.getState();
      if (tutorial?.step === 'harpoon_action') {
        const target = this.getTutorialTargetCenter();
        if (target) {
          const pivot = this.getHookPivotPosition();
          const dx = target.x - pivot.x;
          const dy = target.y - pivot.y;
          let targetAngle = Math.atan2(dy, -dx);
          if (targetAngle < 0) {
            targetAngle = dx > 0 ? 0 : Math.PI;
          }
          const angleDiff = Math.abs(this.state.hook.angle - targetAngle);
          if (angleDiff > 0.28) {
            return;
          }
        }
      }
      this.state.hook.state = 'harpoon';
      this.state.hook.targetX = cx;
      this.state.hook.targetY = cy;
      this.onBoosterUsed('harpoon');
      return;
    } else if (this.state.hook.state === 'tnt_aiming' && this.state.hook.targetX !== undefined && this.state.hook.targetY !== undefined) {
      const tutorial = this.tutorialManager?.getState();
      if (tutorial?.step === 'tnt_action') {
        const target = this.getTutorialTargetCenter();
        if (target) {
          const half = 120;
          const dx = Math.abs(this.state.hook.targetX - target.x);
          const dy = Math.abs(this.state.hook.targetY - target.y);
          if (dx > half || dy > half) {
            return;
          }
        }
      }
      this.handleTntExplosion(this.state.hook.targetX, this.state.hook.targetY);
      this.state.hook.state = 'idle';
      this.onBoosterUsed('tnt');
      return;
    }

    const isIdle = this.state.hook.state === 'idle';
    // Normal Hook Launch on tap
    if (isIdle && this.state.hookAttempts > 0 && !this.isArriving && !this.state.activeBooster) {
      this.state.hook.state = 'shooting';
      this.hookLaunchMs = 250;
    }
  }


  private loop = (timestamp: number = 0) => {
    if (!this.state.isPlaying) return;

    // 30fps throttle — sufficient for mobile performance
    // 33ms = ~30fps; we cap to 30fps instead of 60fps if the device can't handle it
    if (timestamp - this.lastFrameTime < 33 && !this.state.isPaused) {
      requestAnimationFrame(this.loop);
      return;
    }

    const deltaTime = Math.min(timestamp - this.lastFrameTime, 50); // 50ms cap
    this.lastFrameTime = timestamp;

    if (this.state.isPaused) {
      requestAnimationFrame(this.loop); // Keep requesting frames to check for unpause
      return;
    }

    // Hit-stop: skip logic update, continue drawing
    this.effects.update(deltaTime, timestamp);
    let updateMs = 0;
    let drawMs = 0;
    if (!this.effects.isHitStopped) {
      if (this.perfEnabled) {
        const updateStart = performance.now();
        this.update(deltaTime);
        updateMs = performance.now() - updateStart;
      } else {
        this.update(deltaTime);
      }
    }
    if (this.perfEnabled) {
      const drawStart = performance.now();
      this.draw(timestamp);
      drawMs = performance.now() - drawStart;
      this.recordPerf(updateMs + drawMs, updateMs, drawMs, timestamp);
    } else {
      this.draw(timestamp);
    }

    requestAnimationFrame(this.loop);
  };

  public activateAnchor() {
    this.state.anchorEffectTimerMs = 20000;
    this.onBoosterUsed('anchor');
    if (this.state.level === 1 && this.tutorialManager?.isActive()) {
      this.tutorialAnchorUsed = true;
    }
    this.effects.spawnSplash(CANVAS_WIDTH / 2, SEA_LEVEL_Y);
    const { x, y } = this.getAnchorAttachPoint();
    this.anchorVisualX = x;
    this.anchorVisualY = y;
    this.anchorDropElapsed = 0;
    this.anchorVisualState = 'dropping';
  }

  public update(deltaTime: number) {
    if (this.state.startTimerMs > 0) {
      this.state.startTimerMs -= deltaTime;
      if (this.state.startTimerMs < 0) this.state.startTimerMs = 0;
      return;
    }
    if (!this.state.isPlaying || this.state.isPaused) return;

    if (this.tutorialManager) {
      this.tutorialManager.update(deltaTime);
    }
    if (this.tutorialFrozen) {
      // Partial update during tutorial freeze: allow hook aiming/movement (e.g. Harpoon/TNT/Net)
      this.updateHook(deltaTime);
      return;
    }
    const tutorialActive = this.state.level === 1 && this.tutorialManager?.isActive();

    if (this.isSinking) {
      this.sinkProgress += deltaTime / 2000;
      if (this.sinkProgress >= 1) {
        this.sinkProgress = 1;
        this.state.isPlaying = false;
        // Trigger game over with generic message
        this.onGameOver(this.state.score, this.state.level, "The boat sank! It was crushed under heavy load.");
      }
      return;
    }

    this.updateTimers(deltaTime);
    this.updateAnchorVisual(deltaTime);

    if (this.isArriving) {
      this.arrivalProgress += deltaTime / 2000;
      if (this.arrivalProgress >= 1) {
        this.arrivalProgress = 1;
        this.state.isPlaying = false;
        // Small delay to let the animation settle
        setTimeout(() => {
          this.onLevelComplete(this.state.level);
        }, 100);
      }
      // ONLY return and freeze logic when completely arrived
      if (!this.state.isPlaying) return;
    }

    if (!tutorialActive) {
      if (this.state.timeRemaining > 0) {
        if (this.state.anchorEffectTimerMs <= 0) {
          this.state.timeRemaining -= deltaTime / 1000;
        }
      } else if (!this.isArriving) {
        this.isArriving = true;
        this.state.hook.state = 'idle';
        // Reset arrival progress to ensure a clean animation start
        this.arrivalProgress = 0;
      }
    }

    this.updateHook(deltaTime);
    this.updateFishes(deltaTime);
    this.spawnFishes(deltaTime);
    this.ensureAmbientBubbles();
  }

  private updateTimers(deltaTime: number) {
    const clamp = (value: number) => Math.max(0, value - deltaTime);
    const prevHookBrokenMs = this.state.hookBrokenMs;
    const prevLavaBurnMs = this.state.lavaBurnMs;
    this.state.hookSpeedBoostMs = clamp(this.state.hookSpeedBoostMs);
    this.state.fishPanicMs = clamp(this.state.fishPanicMs);
    this.state.buoyancyOffsetMs = clamp(this.state.buoyancyOffsetMs);
    this.state.weightDisplayOffsetMs = clamp(this.state.weightDisplayOffsetMs);
    this.state.anchorSnagMs = clamp(this.state.anchorSnagMs);
    this.state.hookBrokenMs = clamp(this.state.hookBrokenMs);
    this.state.zapShockMs = clamp(this.state.zapShockMs);
    this.state.moonSlowMs = clamp(this.state.moonSlowMs);
    this.state.lavaBurnMs = clamp(this.state.lavaBurnMs);
    this.state.anchorEffectTimerMs = clamp(this.state.anchorEffectTimerMs);

    // Lava burn: add +1 weight per second while active
    if (this.state.lavaBurnMs > 0) {
      const prevSecond = Math.floor(prevLavaBurnMs / 1000);
      const curSecond = Math.floor(this.state.lavaBurnMs / 1000);
      if (curSecond < prevSecond) {
        // A full second has passed — add +1 weight
        this.state.buoyancyOffset += 1;
        this.recalculateStorage();
      }
    }

    if (this.state.buoyancyOffsetMs === 0 && this.state.buoyancyOffset !== 0 && this.state.lavaBurnMs === 0) {
      this.state.buoyancyOffset = 0;
      this.recalculateStorage();
    }
    if (this.state.weightDisplayOffsetMs === 0 && this.state.weightDisplayOffset !== 0) {
      this.state.weightDisplayOffset = 0;
    }
    if (this.state.anchorSnagMs === 0) {
      this.lastSnagType = null;
    }
    if (prevHookBrokenMs > 0 && this.state.hookBrokenMs === 0 && this.state.hookAttempts > 0) {
      this.state.hook.state = 'idle';
      this.state.hook.length = 0;
      const hookPivot = this.getHookPivotPosition();
      this.state.hook.x = hookPivot.x;
      this.state.hook.y = hookPivot.y;
    }

    // Curse Periodic Loops
    const curse = this.state.activeCurse;

    // Countdown (countdown veya final_2)
    if (curse === 'countdown' || curse === 'final_2') {
      const timerKey = 'geriSayimTimer';
      this.timers[timerKey] = (this.timers[timerKey] || 10000) - deltaTime;
      if (this.timers[timerKey] <= 0) {
        this.state.upgrades.storageCapacity = Math.max(30, this.state.upgrades.storageCapacity - 5);
        this.recalculateStorage();
        this.effects.shakeScreen(5, 10);
        this.state.curseTimerMs = 0;
        this.state.upgrades.storageCapacity = Math.max(10, this.state.upgrades.storageCapacity - 5);
        this.recalculateStorage();
      }
    } else if (curse === 'time_bomb') {
      this.state.curseTimerMs += deltaTime;
      if (this.state.curseTimerMs >= 8000) { // Her 8 saniyede bir
        this.state.curseTimerMs = 0;
        if (this.state.inventory.length > 0) {
          // Delete a random item
          const idx = Math.floor(Math.random() * this.state.inventory.length);
          this.state.inventory.splice(idx, 1);
          this.recalculateStorage();
          this.effects.shakeScreen(3, 5);
        }
      }
    }
  }

  private pickWeather(): GameState['weather'] {
    const config = LEVEL_CONFIG[this.state.level];
    if (!config) return 'sunny';
    const weights = config.weatherWeights;
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    const roll = Math.random() * total;
    let acc = 0;
    for (const [weather, weight] of entries) {
      acc += weight;
      if (roll <= acc) return weather as GameState['weather'];
    }
    return 'sunny';
  }

  private seedStaticObstacles() {
    const config = LEVEL_CONFIG[this.state.level];
    if (!config) return;
    const spawnStatic = (type: FishClass, count: number) => {
      for (let i = 0; i < count; i++) {
        const configEntry = OBJECT_MATRIX[type];
        const isBottom = ['sea_rock_large', 'sea_kelp', 'anchor', 'coral', 'gold_doubloon', 'shell', 'sunken_boat'].includes(type);
        let y = isBottom ? CANVAS_HEIGHT - 20 : CANVAS_HEIGHT - 60 + Math.random() * 20;
        let x = 40 + Math.random() * (CANVAS_WIDTH - 80);

        if (type === 'sea_rock' && !isBottom) {
          y = SEA_LEVEL_Y + 150 + Math.random() * (CANVAS_HEIGHT - SEA_LEVEL_Y - 250);
        } else if (type === 'sea_kelp_horizontal') {
          y = SEA_LEVEL_Y + 100 + Math.random() * 150;
        }

        this.state.fishes.push({
          id: Math.random(),
          type,
          name: configEntry.names[0],
          x,
          y,
          startY: y,
          animationOffset: Math.random() * 1000,
          speed: configEntry.speedMultiplier,
          value: configEntry.value,
          weight: configEntry.weightMultiplier,
          color: configEntry.colors[0],
          radius: configEntry.radius,
          direction: -1
        });
      }
    };
    spawnStatic('sea_kelp', config.obstacles.sea_kelp);
    spawnStatic('sea_kelp_horizontal', Math.ceil(config.obstacles.sea_kelp * 1.2));
    spawnStatic('sea_rock_large', config.obstacles.sea_rock);
    spawnStatic('sea_rock', Math.ceil(config.obstacles.sea_rock * 0.6));
    spawnStatic('coral', config.obstacles.coral);
    spawnStatic('anchor', config.obstacles.anchor);

    config.dynamic?.forEach(type => {
      if (['gold_doubloon', 'shell', 'sunken_boat'].includes(type)) {
        spawnStatic(type, type === 'shell' ? 2 : 1);
      }
    });
  }

  public earnCoins(amount: number) {
    this.state.score += amount;
    if (amount > 0) {
      this.totalCoinsEarned += amount;
      addSessionEarning(amount);
      this.onEarning(amount);
    }
    this.onScoreUpdate(this.state.score);
  }

  // calculateFinalScore removed

  public recalculateStorage() {
    const actualWeight = this.state.inventory.reduce((sum, item) => sum + item.weight, 0);
    // currentStorage display value includes temporary buoyancy offsets (visual stress as per game_design 2.2)
    this.state.currentStorage = actualWeight + (this.state.buoyancyOffset || 0);
    const maxStorage = this.state.upgrades.storageCapacity || 50;
    // Sink check only against real inventory weight as per game_design
    if (actualWeight > maxStorage) {
      this.isSinking = true;
    }
  }

  private getRodStats() {
    const rodLevel = this.state.upgrades.rodLevel || 1;
    const rodWidth = 2 + Math.min(4, rodLevel - 1);
    const lineWidth = 1.2 + Math.min(4, rodLevel - 1) * 0.4;
    return {
      swingMultiplier: this.state.upgrades.swingSpeed || 0.018,
      throwMultiplier: this.state.upgrades.castSpeed || 0.85,
      returnMultiplier: this.state.upgrades.returnSpeed || 0.85,
      catchMultiplier: 1,
      coralProtection: (this.state.upgrades.coralProtection || 0) / 100,
      kelpSnagMs: (this.state.upgrades.kelpDuration || 0.8) * 1000,
      rodWidth,
      lineWidth,
      maxAttempts: this.state.upgrades.castAttempts || 3,
    };
  }

  private updateHook(deltaTime: number) {
    const hook = this.state.hook;
    const rod = this.getRodStats();
    const hookPivot = this.getHookPivotPosition();
    const pivotX = hookPivot.x;
    const pivotY = hookPivot.y;
    if (this.state.hookBrokenMs > 0) {
      hook.state = 'idle';
      hook.length = 0;
      hook.x = pivotX;
      hook.y = pivotY;
      this.wasSubmerged = false;
      return;
    }
    // Launch animation update
    if (this.hookLaunchMs > 0) this.hookLaunchMs -= deltaTime;

    const isCurrentlySubmerged = hook.y > SEA_LEVEL_Y;
    if (isCurrentlySubmerged !== this.wasSubmerged && hook.state !== 'idle') {
      if (isCurrentlySubmerged) {
        this.effects.spawnSplash(hook.x, SEA_LEVEL_Y);
      } else {
        this.effects.spawnExitSplash(hook.x, SEA_LEVEL_Y);
      }
      this.wasSubmerged = isCurrentlySubmerged;
    }
    const baseSpeed = 0.45 * (this.state.hookSpeedBoostMs > 0 ? 1.3 : 1);
    const throwSpeed = baseSpeed * rod.throwMultiplier;
    const catchMultiplier = rod.catchMultiplier;
    const depthPercent = Math.max(0.1, Math.min(1, (this.state.upgrades.hookDepth || 50) / 100));
    const waterDepth = CANVAS_HEIGHT - SEA_LEVEL_Y - (this.state.weather === 'stormy' ? 10 : 0);
    const maxDepth = SEA_LEVEL_Y + waterDepth * depthPercent;

    if (hook.state === 'idle') {
      const minAngle = 0;
      const maxAngle = Math.PI;

      // Tasarımdaki rad/frame değerini rad/ms'e çevirmek için ~0.06 çarpanı (1/16.6ms)
      let oscillationSpeed = 0.06 * rod.swingMultiplier;

      // 'random_loop' curse: Swing speed changes constantly
      if (this.state.activeCurse === 'random_loop') {
        // Her 2 saniyede bir değişen hız çarpanı (0.3x ile 2.5x arası)
        const speedVar = 1.4 + Math.sin(performance.now() * 0.003) * 1.1;
        oscillationSpeed *= speedVar;
      }

      if (hook.direction === 1) {
        hook.angle += oscillationSpeed * deltaTime;
        if (hook.angle >= maxAngle) {
          hook.angle = maxAngle - 0.01; // Avoid exact PI stuck
          hook.direction = -1;
        }
      } else {
        hook.angle -= oscillationSpeed * deltaTime;
        if (hook.angle <= minAngle) {
          hook.angle = minAngle + 0.01; // Avoid exact 0 stuck
          hook.direction = 1;
        }
      }

      // 180 derece su altı salınımı: 0 = SOL, PI = SAĞ
      const idleLength = 120; // Daha görünür salınım için 120px

      hook.x = pivotX - Math.cos(hook.angle) * idleLength;
      hook.y = pivotY + Math.sin(hook.angle) * idleLength;
      hook.length = 0;
    } else if (hook.state === 'aiming') {
      const aimLength = 120;

      hook.x = pivotX - Math.cos(hook.angle) * aimLength;
      hook.y = pivotY + Math.sin(hook.angle) * aimLength;
      hook.length = 0;
    } else if (hook.state === 'retracting' || hook.state === 'snagged' || hook.state === 'whirlpool') {
      if (hook.state === 'retracting') {
        let vBase = baseSpeed * 1.5 * rod.returnMultiplier;
        if (this.state.anchorSnagMs > 0 && this.lastSnagType === 'anchor') {
          vBase *= 0.3;
        }
        let weightMult = hook.caughtEntity ? hook.caughtEntity.weight : 1.0;

        // Upgrade application: Rod Level reduces weight penalty
        const weightBonus = (this.state.upgrades.rodLevel - 1) * 0.2;
        const weight = Math.max(1, weightMult - weightBonus);

        let retractSpeed = (vBase / weight) * deltaTime;

        hook.length -= retractSpeed;

        if (hook.length <= 0) {
          hook.length = 0;
          hook.state = 'idle';
          // Ensure continuous oscillation by starting from current angle but enforcing direction
          hook.direction = Math.random() < 0.5 ? 1 : -1;

          if (hook.caughtEntity) {
            const caught = hook.caughtEntity;
            const storeCatch = this.state.anchorEffectTimerMs <= 0;

            // Zap shock: 50% chance caught fish escapes if shock is active
            if (this.state.zapShockMs > 0 && caught.type !== 'sunken_boat' && caught.type !== 'gold_doubloon' && caught.type !== 'shell') {
              if (Math.random() < 0.5) {
                // Fish escapes!
                hook.caughtEntity = null;
                return;
              }
            }

            if (caught.type === 'sunken_boat') {
              this.handleSunkenBoat(caught, storeCatch);
              this.effects.spawnRareCatch(pivotX, pivotY, '#8B4513');
            } else if (caught.type === 'shell') {
              this.handleShell(caught, storeCatch);
              this.effects.spawnSmallCatch(pivotX, pivotY, '#FFEFD5');
            } else {
              this.handleStandardCatch(caught, false, storeCatch);
            }
            // Tekne bob animasyonu (mechanical.md)
            this.effects.triggerBoatBob();
            hook.caughtEntity = null;
          }
        } else {
          hook.x = pivotX - Math.cos(hook.angle) * hook.length;
          hook.y = pivotY + Math.sin(hook.angle) * hook.length;
        }
      } else if (hook.state === 'whirlpool' && this.whirlpoolCenter) {
        const center = this.whirlpoolCenter;
        this.whirlpoolAngle += 0.02 * deltaTime;
        if (this.whirlpoolAngle >= Math.PI * 2) {
          this.whirlpoolAngle -= Math.PI * 2;
          this.whirlpoolTurns += 1;
        }

        hook.x = center.x + Math.cos(this.whirlpoolAngle) * this.whirlpoolRadius;
        hook.y = center.y + Math.sin(this.whirlpoolAngle) * this.whirlpoolRadius;

        if (this.whirlpoolTurns >= 3) {
          const outcome = Math.random();
          if (outcome < 0.4) {
            // New coordinate system: angle = PI - atan2(dy, dx)
            const angle = Math.PI - Math.atan2(hook.y - pivotY, hook.x - pivotX);
            hook.angle = angle;
            hook.length = Math.hypot(hook.x - pivotX, hook.y - pivotY);
            hook.state = 'shooting';
          } else if (outcome < 0.75) {
            const angle = Math.PI - Math.atan2(pivotY - pivotY, hook.x - pivotX);
            hook.angle = angle;
            hook.length = Math.hypot(hook.x - pivotX, pivotY - pivotY);
            hook.y = pivotY;
            hook.state = 'retracting';
            this.state.timeRemaining = Math.max(0, this.state.timeRemaining - 3);
          } else {
            hook.state = 'idle';
            hook.length = 0;
            hook.x = pivotX;
            hook.y = pivotY;
          }
          this.whirlpoolCenter = null;
        }
      } else if (hook.state === 'snagged') {
        if (hook.caughtEntity) {
          hook.x = hook.caughtEntity.x;
          hook.y = hook.caughtEntity.y;

          // Break hook if entity goes off-screen or is removed
          if (hook.x < -hook.caughtEntity.radius || !this.state.fishes.includes(hook.caughtEntity)) {
            this.triggerHookBreak();
          }
        } else {
          this.triggerHookBreak();
        }
      }
    } else if (hook.state === 'shooting' || hook.state === 'harpoon') {
      const speedMult = hook.state === 'harpoon' ? 4.0 : 1.5;
      hook.length += throwSpeed * speedMult * deltaTime;

      // Harpoon uses fixed angle (set in handleCoordinateInput)
      // Normal shooting uses oscillating angle (handled by engine state)

      hook.x = pivotX - Math.cos(hook.angle) * hook.length;
      hook.y = pivotY + Math.sin(hook.angle) * hook.length;

      if (hook.x < 0 || hook.x > CANVAS_WIDTH || hook.y > maxDepth) {
        hook.state = 'retracting';
        if (this.tutorialManager?.getState().step === 'harpoon_action') {
          this.handleTutorialInteraction('aim_harpoon_complete');
        }
      }

      for (let i = 0; i < this.state.fishes.length; i++) {
        const fish = this.state.fishes[i];

        if (fish.type === 'galaxy' && this.isGalaxyHidden(fish)) {
          continue;
        }

        const rect = this.getEntityRect(fish);
        const catchMultiplier = rod.catchMultiplier;

        // Expand rect by catchMultiplier
        const expandedW = rect.width * catchMultiplier;
        const expandedH = rect.height * catchMultiplier;
        const expandedX = rect.x - (expandedW - rect.width) / 2;
        const expandedY = rect.y - (expandedH - rect.height) / 2;

        const isCollision = hook.x >= expandedX &&
          hook.x <= expandedX + expandedW &&
          hook.y >= expandedY &&
          hook.y <= expandedY + expandedH;

        if (!isCollision) continue;

        if (hook.state === 'harpoon') {
          if (fish.type === 'whirlpool') {
            continue;
          }
          if (fish.type === 'env_bubbles') {
            this.applyBubbleEffect();
            this.state.fishes.splice(i, 1);
            i -= 1;
            continue;
          }
          if (fish.type === 'sunken_boat') {
            this.handleSunkenBoat(fish, false);
            this.effects.spawnRareCatch(fish.x, fish.y, '#8B4513');
            this.state.fishes.splice(i, 1);
            i -= 1;
            continue;
          }
          if (fish.type === 'shell') {
            this.handleShell(fish, false);
            this.effects.spawnSmallCatch(fish.x, fish.y, '#FFEFD5');
            this.state.fishes.splice(i, 1);
            i -= 1;
            continue;
          }
          if (fish.type === 'shark_skeleton') {
            const skeletonPenalty = this.activeVehicleId === 't6' ? Math.round(-10 * 0.75) : -10;
            this.earnCoins(skeletonPenalty);
            this.state.fishPanicMs = 5000;
            this.effects.spawnRockHit(hook.x, hook.y);
            this.state.fishes.splice(i, 1);
            i -= 1;
            continue;
          }
          if (fish.type === 'coral' || fish.type === 'sea_kelp' || fish.type === 'sea_kelp_horizontal' || fish.type === 'sea_rock' || fish.type === 'anchor') {
            this.effects.spawnRockHit(hook.x, hook.y);
            continue;
          }

          this.handleStandardCatch(fish, false, false);
          this.state.fishes.splice(i, 1);
          i -= 1;
          continue;
        }

        if (fish.type === 'coral') {
          hook.state = 'retracting';
          hook.caughtEntity = null;
          this.effects.spawnCoralHit(hook.x, hook.y);
          if (rod.coralProtection === 0 || Math.random() > rod.coralProtection) {
            const curse = this.state.activeCurse;
            const damage = (curse === 'double_damage' || curse === 'combo_2' || curse === 'final_1') ? -2 : -1;
            this.updateHookAttempts(damage);
            this.triggerHookBreak();
          }
          break;
        }

        if (fish.type === 'sea_kelp' || fish.type === 'sea_kelp_horizontal') {
          hook.state = 'retracting';
          hook.caughtEntity = null;
          this.effects.spawnKelpHit(hook.x, hook.y);
          this.state.anchorSnagMs = 200;
          this.lastSnagType = 'kelp';
          this.updateHookAttempts(-1);
          this.triggerHookBreak();
          break;
        }

        if (fish.type === 'sea_rock') {
          hook.state = 'retracting';
          hook.caughtEntity = null;
          this.effects.spawnRockHit(hook.x, hook.y);
          this.state.anchorSnagMs = 200;
          this.lastSnagType = 'rock';
          this.updateHookAttempts(-1);
          this.triggerHookBreak();
          break;
        }

        if (fish.type === 'anchor') {
          hook.state = 'retracting';
          hook.caughtEntity = null;
          this.state.anchorSnagMs = 2000;
          this.lastSnagType = 'anchor';
          this.state.timeRemaining = Math.max(0, this.state.timeRemaining - 2);
          break;
        }

        if (fish.type === 'sunken_boat') {
          hook.state = 'retracting';
          hook.caughtEntity = null;
          this.effects.spawnRockHit(hook.x, hook.y);
          this.updateHookAttempts(-1);
          this.triggerHookBreak();
          break;
        }

        if (fish.type === 'whirlpool') {
          hook.state = 'whirlpool';
          hook.caughtEntity = null;
          this.whirlpoolCenter = { x: fish.x, y: fish.y };
          this.whirlpoolAngle = Math.atan2(hook.y - fish.y, hook.x - fish.x);
          const dist = Math.hypot(hook.x - fish.x, hook.y - fish.y);
          this.whirlpoolRadius = Math.max(20, dist);
          this.whirlpoolTurns = 0;
          if (this.state.upgrades.boatLevel < 3) {
            this.state.weightDisplayOffset = 3;
            this.state.weightDisplayOffsetMs = 2000;
          }
          break;
        }

        if (fish.type === 'shark_skeleton') {
          hook.state = 'retracting';
          hook.caughtEntity = null;
          const skeletonPenalty = this.activeVehicleId === 't6' ? Math.round(-10 * 0.75) : -10;
          this.earnCoins(skeletonPenalty);
          this.updateHookAttempts(-1);
          this.triggerHookBreak();
          this.state.fishPanicMs = 5000;
          break;
        }

        if (fish.type === 'env_bubbles') {
          hook.state = 'retracting';
          hook.caughtEntity = null;
          this.applyBubbleEffect();
          this.state.fishes.splice(i, 1);
          break;
        }

        // Standard catch
        hook.state = 'retracting';
        if (this.tutorialManager?.getState().step === 'harpoon_action') {
          this.handleTutorialInteraction('aim_harpoon_complete');
        }
        hook.caughtEntity = fish;
        this.state.fishes.splice(i, 1);
        this.effects.shakeScreen(3, 3);
        break;
      }
    }
    else if (hook.state === 'net') {
      const dx = (hook.targetX || 0) - hook.x;
      const dy = (hook.targetY || 0) - hook.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 15) {
        this.handleNetCollection();
        hook.state = 'retracting';
      } else {
        const speedMult = 2.5;
        const moveDist = baseSpeed * speedMult * deltaTime;
        hook.x += (dx / dist) * Math.min(dist, moveDist);
        hook.y += (dy / dist) * Math.min(dist, moveDist);
        const hookPivot = this.getHookPivotPosition();
        hook.length = Math.hypot(hook.x - hookPivot.x, hook.y - hookPivot.y);
        hook.angle = Math.atan2(hook.y - hookPivot.y, -(hook.x - hookPivot.x));
      }
    }
  }

  private updateFishes(deltaTime: number) {
    this.activeWhirlpool = null;
    const isAnchorActive = this.state.anchorEffectTimerMs > 0;
    const levelSpeedBonus = (this.state.level - 1) * 0.1;
    const travelSpeed = isAnchorActive ? 0.2 : (2 + levelSpeedBonus); // Slow random-ish movement during anchor
    const panicMultiplier = this.state.fishPanicMs > 0 ? 2 : 1;
    const moonSlowMultiplier = this.state.moonSlowMs > 0 ? 0.6 : 1;
    const timeMs = this.lastFrameTime;
    const time = timeMs * 0.002;
    const dtFactor = deltaTime / 16;
    const weatherSpeedBonus = this.state.weather === 'stormy' ? 0.5 : 0;
    const weatherSpeedMultiplier = this.state.weather === 'rainy' ? 1.2 : 1;
    const holdSlowFactor = this.getHoldSlowFactor();
    const baseSpeed = (f: Entity) => {
      const kingBoost = (f.kingSpeedBoostMs && f.kingSpeedBoostMs > 0) ? 1.6 : 1.0;
      return (f.speed + travelSpeed + weatherSpeedBonus) * weatherSpeedMultiplier * moonSlowMultiplier * (isAnchorActive ? 0.2 : 1) * holdSlowFactor * kingBoost;
    };

    const hookX = this.state.hook.x;
    const hookY = this.state.hook.y;
    const isHookActive = hookY > SEA_LEVEL_Y &&
      this.state.hook.state !== 'idle' &&
      this.state.hook.state !== 'retracting' &&
      this.state.hook.state !== 'snagged' &&
      this.state.hook.state !== 'whirlpool';

    for (let i = this.state.fishes.length - 1; i >= 0; i--) {
      const fish = this.state.fishes[i];
      const prevX = fish.x;
      if (!this.state.hook.caughtEntity || this.state.hook.caughtEntity.id !== fish.id) {
        if (fish.x < -120 || fish.x > CANVAS_WIDTH + 120) {
          this.state.fishes.splice(i, 1);
          continue;
        }
      }

      if (fish.kingSpeedBoostMs && fish.kingSpeedBoostMs > 0) {
        fish.kingSpeedBoostMs -= deltaTime;
      }

      // Flee Logic
      if (fish.fleeVelocityX === undefined) fish.fleeVelocityX = 0;
      if (fish.fleeVelocityY === undefined) fish.fleeVelocityY = 0;

      fish.fleeVelocityX *= 0.85;
      fish.fleeVelocityY *= 0.85;

      if (!isHookActive) {
        fish.fleeVelocityX = 0;
        fish.fleeVelocityY = 0;
      } else {
        const config = FLEE_CONFIG[fish.type] || DEFAULT_FLEE;
        const distToHook = Math.hypot(hookX - fish.x, hookY - fish.y);

        if (distToHook < config.radius) {
          if (fish.type === 'galaxy') {
            const cycle = 1200 + ((fish.animationOffset || 0) % 800);
            const currentPhase = (timeMs + (fish.animationOffset || 0) * 1000) % cycle;
            if (currentPhase < 100) {
              fish.animationOffset = (fish.animationOffset || 0) + (101 - currentPhase) / 1000;
            }
          } else if (fish.type === 'mushroom') {
            const cycle = 1000;
            const currentPhase = (timeMs + (fish.animationOffset || 0) * 1000) % cycle;
            if (currentPhase < 800) {
              fish.animationOffset = (fish.animationOffset || 0) + (801 - currentPhase) / 1000;
            }
          } else if (fish.type === 'king') {
            fish.kingSpeedBoostMs = 2000;
          }

          if (config.power > 0) {
            const strength = (1 - distToHook / config.radius) * config.power;
            const dirX = (fish.x - hookX) / distToHook;
            const dirY = (fish.y - hookY) / distToHook;
            fish.fleeVelocityX += dirX * strength;
            fish.fleeVelocityY += dirY * strength;
          }
        }
      }

      // Trail güncellemesi (hızlı balıklar için)
      if (fish.type === 'zap' || fish.type === 'tide' || fish.type === 'king') {
        this.effects.updateTrail(fish.id, fish.x, fish.y, fish.color);
      }

      // Remove fish that would overlap with the arrival island
      if (this.isArriving) {
        const islandWidth = CANVAS_WIDTH * 0.6;
        const islandX = CANVAS_WIDTH - (Math.min(1, this.arrivalProgress) * islandWidth);
        const landLeftEdge = islandX - 120;
        if (fish.x > landLeftEdge) {
          this.state.fishes.splice(i, 1);
          continue;
        }
      }

      if (this.whirlpoolCenter && this.state.hook.state === 'whirlpool' && fish.value < 100) {
        const dist = Math.hypot(fish.x - this.whirlpoolCenter.x, fish.y - this.whirlpoolCenter.y);
        if (dist < 80) {
          this.state.fishes.splice(i, 1);
          continue;
        }
      }

      if (fish.type === 'env_bubbles') {
        fish.y -= (fish.speed + 1) * dtFactor * holdSlowFactor;
        fish.x += Math.sin(time + (fish.animationOffset || 0)) * 0.3 * holdSlowFactor;
        if (fish.y < SEA_LEVEL_Y - 20) {
          fish.y = CANVAS_HEIGHT - 20;
          fish.x = 20 + Math.random() * (CANVAS_WIDTH - 40);
          fish.startY = fish.y;
        }
      } else if (fish.type === 'bubble') {
        // Bubble: sinüs dalgası + 5-8sn'de bir 0.5sn pause
        const pauseCycle = 5000 + ((fish.animationOffset || 0) % 3000); // 5-8s cycle
        const pausePhase = (timeMs + (fish.animationOffset || 0) * 500) % pauseCycle;
        const isPaused = pausePhase > (pauseCycle - 500); // last 0.5s of cycle = pause
        if (!isPaused) {
          fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        }
        const waveY = Math.sin(fish.x * 0.04) * 20;
        fish.y = (fish.startY || fish.y) + waveY;
      } else if (fish.type === 'zap') {
        // Zap: sharp zigzag — 0.8-1.2s intervals, ±30px vertical jumps
        const zigzagCycle = 800 + ((fish.animationOffset || 0) % 400);
        const zigzagPhase = (timeMs + (fish.animationOffset || 0) * 1000) % zigzagCycle;
        const zigzagSeed = Math.floor((timeMs + (fish.animationOffset || 0) * 1000) / zigzagCycle);
        const zigzagDir = Math.sin(zigzagSeed * 7.13 + (fish.animationOffset || 0)) < 0 ? -1 : 1;
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        // Oscillate around startY — no drift
        const zigzagOffset = zigzagPhase < 150
          ? zigzagDir * 30 * (zigzagPhase / 150)
          : zigzagDir * 30;
        fish.y = (fish.startY || fish.y) + zigzagOffset;
      } else if (fish.type === 'moon') {
        // Moon: very slow S-curve, ±40px, 6s period, 1s pause at peaks
        const moonPeriod = 6;
        const sineProgress = Math.sin(time / (moonPeriod / 2) + (fish.animationOffset || 0));
        const effectiveSine = Math.abs(sineProgress) > 0.95 ? Math.sign(sineProgress) : sineProgress;
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        fish.y = (fish.startY || fish.y) + effectiveSine * 40;
      } else if (fish.type === 'lava') {
        // Lava: diagonal bounce ±60px around startY
        const bouncePeriod = 2000 + ((fish.animationOffset || 0) % 2000);
        const bouncePhase = (timeMs + (fish.animationOffset || 0) * 1000) % bouncePeriod;
        const bounceProgress = bouncePhase / bouncePeriod;
        const triangleWave = bounceProgress < 0.5 ? bounceProgress * 2 - 0.5 : 1.5 - bounceProgress * 2;
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        fish.y = (fish.startY || fish.y) + triangleWave * 60;
      } else if (fish.type === 'tide') {
        // Tide: wide sine ±45px, 2.5s period, very fast
        const tideWave = Math.sin(time * (Math.PI * 2 / 2.5) + (fish.animationOffset || 0)) * 45;
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        fish.y = (fish.startY || fish.y) + tideWave;
      } else if (fish.type === 'candy') {
        const spiral = time * 1.4 + (fish.animationOffset || 0);
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        fish.x += Math.cos(spiral) * 1.5;
        fish.y = (fish.startY || fish.y) + Math.sin(spiral) * 20;
      } else if (fish.type === 'sakura') {
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        const deviation = Math.sin(time + (fish.animationOffset || 0)) * 15;
        fish.y = (fish.startY || fish.y) + deviation;
      } else if (fish.type === 'leaf') {
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        const drift = Math.sin(time + (fish.animationOffset || 0)) * 18;
        fish.y = (fish.startY || fish.y) + drift;
      } else if (fish.type === 'crystal') {
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        const slalom = Math.sin(time * 2 + (fish.animationOffset || 0)) * 35;
        fish.y = (fish.startY || fish.y) + slalom;
      } else if (fish.type === 'galaxy') {
        const cycle = 1200 + ((fish.animationOffset || 0) % 800);
        const phase = (timeMs + (fish.animationOffset || 0) * 1000) % cycle;
        const jumpSeed = Math.floor((timeMs + (fish.animationOffset || 0) * 1000) / cycle);
        const jumpDir = Math.sin(jumpSeed * 12.9898 + (fish.animationOffset || 0)) < 0 ? -1 : 1;
        const jumpOffset = (0.3 + Math.sin(jumpSeed * 9.1 + (fish.animationOffset || 0)) * 0.3) * 50;
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        fish.y = (fish.startY || fish.y) + jumpDir * jumpOffset;
        if (phase < 100) {
          fish.y = fish.startY || fish.y;
        }
      } else if (fish.type === 'mushroom') {
        const cycle = 1000;
        const phase = (timeMs + (fish.animationOffset || 0) * 1000) % cycle;
        const jumpSeed = Math.floor((timeMs + (fish.animationOffset || 0) * 1000) / cycle);
        const jumpDir = Math.sin(jumpSeed * 8.37 + (fish.animationOffset || 0)) < 0 ? -1 : 1;
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        if (phase < 800) {
          fish.y = (fish.startY || fish.y);
        } else {
          const progress = (phase - 800) / 200;
          fish.y = (fish.startY || fish.y) + jumpDir * 25 * Math.sin(progress * Math.PI);
        }
      } else if (fish.type === 'king') {
        const spiral = time * 0.8 + (fish.animationOffset || 0);
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        fish.x += Math.cos(spiral) * 2;
        fish.y = (fish.startY || fish.y) + Math.sin(spiral) * 30;
        if (fish.x < CANVAS_WIDTH && fish.x > 0 && this.state.fishPanicMs < 500) {
          this.state.fishPanicMs = 3000;
        }
      } else if (fish.type === 'gold_doubloon') {
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        fish.y = (fish.startY || fish.y) + Math.sin(time * 0.06 + (fish.animationOffset || 0)) * 0.8;
      } else if (fish.type === 'shark_skeleton') {
        fish.x -= (baseSpeed(fish) * 0.4) * dtFactor;
        fish.y = (fish.startY || fish.y) + Math.sin(time + (fish.animationOffset || 0)) * 8;
      } else if (fish.type === 'whirlpool') {
        fish.x -= (baseSpeed(fish) * 0.4) * dtFactor;
        fish.y = (fish.startY || fish.y) + Math.sin(time + (fish.animationOffset || 0)) * 10;
        this.activeWhirlpool = fish;
      } else if (fish.type === 'anchor') {
        const pendulum = Math.sin(time * (Math.PI * 2 / 4) + (fish.animationOffset || 0)) * 15;
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
        fish.x = (fish.startY !== undefined ? fish.x : fish.x) + pendulum * (deltaTime / 500) * holdSlowFactor;
      } else if (fish.type === 'sea_kelp') {
        fish.x -= baseSpeed(fish) * dtFactor;
        fish.y = (fish.startY || fish.y) + Math.sin(time + (fish.animationOffset || 0)) * 3;
      } else if (fish.type === 'sea_kelp_horizontal') {
        fish.x -= baseSpeed(fish) * dtFactor;
        fish.y = (fish.startY || fish.y) + Math.sin(time + (fish.animationOffset || 0)) * 2;
      } else if (fish.type === 'coral') {
        fish.x -= baseSpeed(fish) * dtFactor;
      } else if (fish.type === 'sea_rock' || fish.type === 'sea_rock_large' || fish.type === 'shell' || fish.type === 'sunken_boat') {
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
      } else {
        fish.x -= baseSpeed(fish) * dtFactor * panicMultiplier;
      }

      // Global Y-clamp: keep all fish within water bounds (never above sea level or below sand)
      const isStaticElement = fish.type === 'sea_kelp' || fish.type === 'sea_kelp_horizontal' ||
        fish.type === 'sea_rock' || fish.type === 'sea_rock_large' || fish.type === 'coral' ||
        fish.type === 'anchor' || fish.type === 'shell' || fish.type === 'gold_doubloon' || fish.type === 'sunken_boat';

      // Anchor direction override
      if (isAnchorActive && !isStaticElement && fish.type !== 'env_bubbles') {
        const dx = fish.x - prevX;
        fish.x = prevX;
        let effDir = fish.direction;
        if (Math.floor(fish.id * 1000) % 10 < 3) { // 30% chance to go right
          effDir = 1;
        }
        fish.x += effDir * Math.abs(dx);
      }

      if (!isStaticElement && fish.type !== 'env_bubbles') {
        const minY = SEA_LEVEL_Y + 15; // at least 15px below water surface
        const maxY = CANVAS_HEIGHT - 80; // above the sand

        // Add Evasion Velocity
        if (Math.abs(fish.fleeVelocityX!) > 0.01) {
          fish.x += fish.fleeVelocityX!;
        }
        if (Math.abs(fish.fleeVelocityY!) > 0.01) {
          fish.y += fish.fleeVelocityY!;
          // Adjust startY so waves/bounces continue from the newly evaded height
          fish.startY = (fish.startY || fish.y) + fish.fleeVelocityY!;
        }

        // Hard clamp limits (only Y axis to allow natural despawn)
        fish.y = Math.max(minY, Math.min(maxY, fish.y));
        if (fish.startY) {
          fish.startY = Math.max(minY, Math.min(maxY, fish.startY));
        }
      }

      if (this.state.fishPanicMs > 0 && fish.value < 100 && fish.type !== 'env_bubbles') {
        fish.y += Math.sin(time * 8 + (fish.animationOffset || 0)) * 2;
      }

      // Despawn logic for all non-static fish
      if (fish.x < -120 || fish.x > CANVAS_WIDTH + 120) {
        this.state.fishes.splice(i, 1);
      }
    }
  }

  private handleTntExplosion(tx: number, ty: number) {
    this.effects.spawnExplosion(tx, ty); // Need to add this to GameEffects
    this.effects.shakeScreen(15, 10);

    const explosionRadius = 120; // 3x3 grid size representation and hit area

    // Collect all fish in radius
    for (let i = this.state.fishes.length - 1; i >= 0; i--) {
      const fish = this.state.fishes[i];
      const dist = Math.hypot(fish.x - tx, fish.y - ty);
      if (dist < explosionRadius && !OBJECT_MATRIX[fish.type].isObstacle) {
        this.handleStandardCatch(fish, false, false);
        this.state.fishes.splice(i, 1);
      }
    }
  }

  private handleNetCollection() {
    this.effects.shakeScreen(5, 5);
    // Collect ALL fish on screen
    const storeCatch = this.state.anchorEffectTimerMs <= 0;
    for (let i = this.state.fishes.length - 1; i >= 0; i--) {
      const fish = this.state.fishes[i];
      if (!OBJECT_MATRIX[fish.type].isObstacle) {
        this.handleStandardCatch(fish, true, storeCatch);
        this.state.fishes.splice(i, 1);
      }
    }
  }

  private spawnFishes(deltaTime: number) {
    // Stop spawning if arriving
    if (this.isArriving) return;
    if (this.state.level === 1) return;

    const levelConfig = LEVEL_CONFIG[this.state.level];
    if (!levelConfig) return;
    const maxEntities = Math.min(120, 30 + this.state.level * 1.2);
    if (this.state.fishes.length >= maxEntities) return;
    const weatherSpawnMultiplier = this.state.weather === 'cloudy' ? 1.1 : this.state.weather === 'magic' ? 1.25 : 1;
    // Base spawn chance increases with levels
    const densityRatio = this.state.fishes.length / maxEntities;
    const spawnChance = (0.012 + this.state.level * 0.003) * weatherSpawnMultiplier * Math.max(0.35, 1 - densityRatio);

    if (Math.random() < spawnChance) {
      const pool: Array<{ type: FishClass; weight: number }> = [];

      if (!this.levelSpawnWeights) {
        this.levelSpawnWeights = {
          1: { bubble: 95, sakura: 70 },
          2: { bubble: 88, sakura: 72, zap: 18 },
          3: { bubble: 85, sakura: 70, zap: 25 },
          4: { bubble: 82, sakura: 68, zap: 30, candy: 12 },
          5: { bubble: 78, sakura: 65, zap: 35, candy: 30 },
          6: { bubble: 72, sakura: 60, zap: 45, candy: 28 },
          7: { bubble: 80, sakura: 68, zap: 38, candy: 28 },
          8: { bubble: 68, sakura: 58, zap: 42, candy: 28, moon: 12 },
          9: { bubble: 65, sakura: 55, zap: 42, candy: 32, moon: 16 },
          10: { bubble: 72, sakura: 62, zap: 40, candy: 30, moon: 18 },
          11: { bubble: 62, sakura: 55, zap: 44, candy: 28, moon: 18, lava: 8 },
          12: { bubble: 60, sakura: 52, zap: 44, candy: 28, moon: 20, lava: 18 },
          13: { bubble: 72, sakura: 62, zap: 40, candy: 30, moon: 20, lava: 15 },
          14: { bubble: 58, sakura: 50, zap: 44, candy: 26, moon: 20, lava: 18, tide: 12 },
          15: { bubble: 56, sakura: 49, zap: 43, candy: 26, moon: 20, lava: 18, tide: 14 },
          16: { bubble: 54, sakura: 47, zap: 43, candy: 25, moon: 21, lava: 18, tide: 15, leaf: 6 },
          17: { bubble: 52, sakura: 46, zap: 43, candy: 25, moon: 21, lava: 18, tide: 15, leaf: 7 },
          18: { bubble: 50, sakura: 44, zap: 43, candy: 25, moon: 21, lava: 19, tide: 16, leaf: 8 },
          19: { bubble: 48, sakura: 43, zap: 43, candy: 25, moon: 21, lava: 19, tide: 16, leaf: 8 },
          20: { bubble: 46, sakura: 42, zap: 43, candy: 25, moon: 22, lava: 19, tide: 16, leaf: 9, crystal: 4 },
          21: { bubble: 44, sakura: 40, zap: 43, candy: 26, moon: 22, lava: 19, tide: 16, leaf: 9, crystal: 5 },
          22: { bubble: 42, sakura: 38, zap: 43, candy: 25, moon: 22, lava: 20, tide: 17, leaf: 10, crystal: 6 },
          23: { bubble: 40, sakura: 36, zap: 48, candy: 24, moon: 22, lava: 20, tide: 22, leaf: 10, crystal: 6 },
          24: { bubble: 46, sakura: 43, zap: 40, candy: 28, moon: 23, lava: 19, tide: 16, leaf: 11, crystal: 6 },
          25: { bubble: 40, sakura: 36, zap: 42, candy: 24, moon: 23, lava: 20, tide: 17, leaf: 11, crystal: 7, galaxy: 5 },
          26: { bubble: 38, sakura: 34, zap: 42, candy: 24, moon: 23, lava: 21, tide: 17, leaf: 11, crystal: 7, galaxy: 6 },
          27: { bubble: 38, sakura: 34, zap: 42, candy: 24, moon: 23, lava: 21, tide: 17, leaf: 11, crystal: 7, galaxy: 6 },
          28: { bubble: 38, sakura: 34, zap: 41, candy: 24, moon: 23, lava: 21, tide: 17, leaf: 12, crystal: 8, galaxy: 6 },
          29: { bubble: 45, sakura: 41, zap: 40, candy: 28, moon: 23, lava: 19, tide: 15, leaf: 12, crystal: 7, galaxy: 5 },
          30: { bubble: 36, sakura: 32, zap: 42, candy: 24, moon: 23, lava: 21, tide: 17, leaf: 12, crystal: 9, galaxy: 7, mushroom: 3 },
          31: { bubble: 36, sakura: 32, zap: 41, candy: 23, moon: 23, lava: 21, tide: 17, leaf: 12, crystal: 10, galaxy: 7, mushroom: 5 },
          32: { bubble: 34, sakura: 30, zap: 41, candy: 32, moon: 23, lava: 21, tide: 17, leaf: 13, crystal: 10, galaxy: 7, mushroom: 5 },
          33: { bubble: 33, sakura: 30, zap: 45, candy: 23, moon: 23, lava: 22, tide: 20, leaf: 13, crystal: 10, galaxy: 8, mushroom: 5 },
          34: { bubble: 42, sakura: 38, zap: 40, candy: 28, moon: 23, lava: 20, tide: 16, leaf: 13, crystal: 9, galaxy: 7, mushroom: 5 },
          35: { bubble: 33, sakura: 30, zap: 41, candy: 23, moon: 23, lava: 22, tide: 17, leaf: 13, crystal: 11, galaxy: 8, mushroom: 6, king: 2 },
          36: { bubble: 31, sakura: 28, zap: 41, candy: 23, moon: 23, lava: 22, tide: 17, leaf: 13, crystal: 11, galaxy: 8, mushroom: 6, king: 3 },
          37: { bubble: 31, sakura: 28, zap: 41, candy: 23, moon: 23, lava: 22, tide: 17, leaf: 13, crystal: 11, galaxy: 8, mushroom: 12 },
          38: { bubble: 30, sakura: 27, zap: 41, candy: 22, moon: 23, lava: 22, tide: 17, leaf: 13, crystal: 11, galaxy: 14, mushroom: 7, king: 3 },
          39: { bubble: 29, sakura: 26, zap: 41, candy: 22, moon: 23, lava: 22, tide: 17, leaf: 13, crystal: 11, galaxy: 9, mushroom: 7, king: 4 },
          40: { bubble: 28, sakura: 25, zap: 41, candy: 22, moon: 23, lava: 22, tide: 17, leaf: 13, crystal: 12, galaxy: 10, mushroom: 8, king: 5 },
          41: { bubble: 27, sakura: 24, zap: 41, candy: 22, moon: 23, lava: 23, tide: 18, leaf: 13, crystal: 13, galaxy: 10, mushroom: 8, king: 5 },
          42: { bubble: 26, sakura: 23, zap: 41, candy: 21, moon: 23, lava: 23, tide: 18, leaf: 13, crystal: 13, galaxy: 10, mushroom: 9, king: 5 },
          43: { bubble: 26, sakura: 22, zap: 41, candy: 28, moon: 22, lava: 22, tide: 17, leaf: 14, crystal: 13, galaxy: 10, mushroom: 9, king: 5 },
          44: { bubble: 32, sakura: 29, zap: 40, candy: 28, moon: 23, lava: 21, tide: 16, leaf: 14, crystal: 12, galaxy: 9, mushroom: 8, king: 4 },
          45: { bubble: 25, sakura: 22, zap: 41, candy: 21, moon: 23, lava: 23, tide: 18, leaf: 13, crystal: 13, galaxy: 11, mushroom: 9, king: 8 },
          46: { bubble: 24, sakura: 21, zap: 40, candy: 21, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 13, galaxy: 11, mushroom: 10, king: 8 },
          47: { bubble: 24, sakura: 21, zap: 40, candy: 21, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 13, galaxy: 11, mushroom: 18, king: 7 },
          48: { bubble: 23, sakura: 21, zap: 40, candy: 21, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 13, galaxy: 16, mushroom: 10, king: 8 },
          49: { bubble: 22, sakura: 20, zap: 40, candy: 21, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 13, galaxy: 11, mushroom: 10, king: 9 },
          50: { bubble: 21, sakura: 19, zap: 40, candy: 21, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 14, galaxy: 12, mushroom: 11, king: 10 },
          51: { bubble: 20, sakura: 18, zap: 40, candy: 21, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 14, galaxy: 13, mushroom: 11, king: 10 },
          52: { bubble: 19, sakura: 17, zap: 40, candy: 21, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 14, galaxy: 13, mushroom: 11, king: 11 },
          53: { bubble: 26, sakura: 24, zap: 39, candy: 26, moon: 23, lava: 21, tide: 17, leaf: 14, crystal: 13, galaxy: 12, mushroom: 10, king: 8 },
          54: { bubble: 18, sakura: 16, zap: 40, candy: 20, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 14, galaxy: 13, mushroom: 11, king: 14 },
          55: { bubble: 18, sakura: 16, zap: 40, candy: 20, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 14, galaxy: 13, mushroom: 12, king: 11 },
          56: { bubble: 17, sakura: 15, zap: 40, candy: 20, moon: 22, lava: 23, tide: 18, leaf: 13, crystal: 14, galaxy: 18, mushroom: 12, king: 11 },
          57: { bubble: 17, sakura: 15, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 13, mushroom: 12, king: 12 },
          58: { bubble: 16, sakura: 15, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 14, mushroom: 12, king: 13 },
          59: { bubble: 16, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 14, mushroom: 13, king: 13 },
          60: { bubble: 15, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 15, mushroom: 13, king: 15 },
          61: { bubble: 15, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 15, mushroom: 13, king: 15 },
          62: { bubble: 15, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 15, mushroom: 13, king: 15 },
          63: { bubble: 15, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 15, mushroom: 13, king: 15 },
          64: { bubble: 22, sakura: 20, zap: 38, candy: 26, moon: 23, lava: 22, tide: 17, leaf: 14, crystal: 14, galaxy: 13, mushroom: 12, king: 12 },
          65: { bubble: 15, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 15, mushroom: 13, king: 15 },
          66: { bubble: 15, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 15, mushroom: 13, king: 15 },
          67: { bubble: 15, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 15, mushroom: 13, king: 15 },
          68: { bubble: 23, sakura: 21, zap: 38, candy: 26, moon: 23, lava: 22, tide: 17, leaf: 14, crystal: 14, galaxy: 13, mushroom: 12, king: 13 },
          69: { bubble: 15, sakura: 14, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 15, galaxy: 15, mushroom: 13, king: 15 },
          70: { bubble: 14, sakura: 13, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 16, mushroom: 14, king: 16 },
          71: { bubble: 14, sakura: 13, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 16, mushroom: 14, king: 16 },
          72: { bubble: 14, sakura: 13, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 16, mushroom: 14, king: 16 },
          73: { bubble: 14, sakura: 13, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 16, mushroom: 14, king: 16 },
          74: { bubble: 22, sakura: 20, zap: 38, candy: 26, moon: 23, lava: 22, tide: 17, leaf: 14, crystal: 15, galaxy: 14, mushroom: 13, king: 14 },
          75: { bubble: 14, sakura: 13, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 16, mushroom: 14, king: 17 },
          76: { bubble: 14, sakura: 13, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 16, mushroom: 14, king: 17 },
          77: { bubble: 14, sakura: 13, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 16, mushroom: 14, king: 17 },
          78: { bubble: 22, sakura: 20, zap: 38, candy: 26, moon: 23, lava: 22, tide: 17, leaf: 14, crystal: 15, galaxy: 14, mushroom: 14, king: 14 },
          79: { bubble: 13, sakura: 12, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 16, mushroom: 15, king: 18 },
          80: { bubble: 12, sakura: 11, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 16, galaxy: 17, mushroom: 15, king: 19 },
          81: { bubble: 12, sakura: 11, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 17, mushroom: 15, king: 19 },
          82: { bubble: 12, sakura: 11, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 17, mushroom: 15, king: 19 },
          83: { bubble: 12, sakura: 11, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 17, mushroom: 15, king: 19 },
          84: { bubble: 20, sakura: 18, zap: 38, candy: 25, moon: 23, lava: 22, tide: 17, leaf: 14, crystal: 16, galaxy: 15, mushroom: 14, king: 16 },
          85: { bubble: 12, sakura: 11, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 17, mushroom: 15, king: 20 },
          86: { bubble: 12, sakura: 11, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 17, mushroom: 15, king: 20 },
          87: { bubble: 12, sakura: 11, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 17, mushroom: 15, king: 20 },
          88: { bubble: 20, sakura: 18, zap: 38, candy: 25, moon: 23, lava: 22, tide: 17, leaf: 14, crystal: 16, galaxy: 15, mushroom: 15, king: 17 },
          89: { bubble: 12, sakura: 11, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 17, mushroom: 15, king: 21 },
          90: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 22 },
          91: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 22 },
          92: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 22 },
          93: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 23 },
          94: { bubble: 18, sakura: 17, zap: 37, candy: 24, moon: 23, lava: 22, tide: 17, leaf: 14, crystal: 16, galaxy: 16, mushroom: 15, king: 18 },
          95: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 24 },
          96: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 24 },
          97: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 25 },
          98: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 26 },
          99: { bubble: 11, sakura: 10, zap: 40, candy: 20, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 17, galaxy: 18, mushroom: 16, king: 27 },
          100: { bubble: 10, sakura: 9, zap: 38, candy: 19, moon: 22, lava: 24, tide: 18, leaf: 13, crystal: 18, galaxy: 19, mushroom: 17, king: 28 }
        };
      }
      const LEVEL_SPAWN_WEIGHTS = this.levelSpawnWeights!;

      if (!this.levelObjectWeights) {
        this.levelObjectWeights = {
          1: { shell: 100 },
          2: { shell: 85 },
          3: { shell: 88 },
          4: { shell: 80 },
          5: { shell: 75, gold_doubloon: 20 },
          6: { shell: 65 },
          7: { shell: 80, gold_doubloon: 100 },
          8: { shell: 58, gold_doubloon: 22 },
          9: { shell: 55 },
          10: { shell: 75, gold_doubloon: 40 },
          11: { shell: 52, sunken_boat: 22 },
          12: { shell: 50, sunken_boat: 25 },
          13: { shell: 72, gold_doubloon: 35, sunken_boat: 25 },
          14: { shell: 45 },
          15: { shell: 45 },
          16: { shell: 45, gold_doubloon: 28 },
          17: { shell: 42, sunken_boat: 28 },
          18: { shell: 40, gold_doubloon: 28 },
          19: { shell: 38, gold_doubloon: 32 },
          20: { shell: 45, gold_doubloon: 45, sunken_boat: 35 },
          21: { shell: 50, gold_doubloon: 25 },
          22: { shell: 45, sunken_boat: 28 },
          23: { shell: 42, gold_doubloon: 30 },
          24: { shell: 70, gold_doubloon: 38, sunken_boat: 28 },
          25: { shell: 40, gold_doubloon: 30 },
          26: { shell: 38, sunken_boat: 30 },
          27: { shell: 38, gold_doubloon: 32 },
          28: { shell: 40, sunken_boat: 28 },
          29: { shell: 68, gold_doubloon: 40, sunken_boat: 30 },
          30: { shell: 45, gold_doubloon: 48, sunken_boat: 35 },
          31: { shell: 40, gold_doubloon: 28, sunken_boat: 25 },
          32: { shell: 38, gold_doubloon: 30 },
          33: { shell: 36, sunken_boat: 28 },
          34: { shell: 65, gold_doubloon: 42, sunken_boat: 32 },
          35: { shell: 38, gold_doubloon: 32 },
          36: { shell: 35, sunken_boat: 30 },
          37: { shell: 36, gold_doubloon: 33, sunken_boat: 28 },
          38: { shell: 35, gold_doubloon: 30 },
          39: { shell: 35, gold_doubloon: 32, sunken_boat: 28 },
          40: { shell: 45, gold_doubloon: 50, sunken_boat: 38 },
          41: { shell: 36, gold_doubloon: 30, sunken_boat: 26 },
          42: { shell: 34, sunken_boat: 30 },
          43: { shell: 34, gold_doubloon: 30 },
          44: { shell: 60, gold_doubloon: 45, sunken_boat: 35 },
          45: { shell: 34, gold_doubloon: 32 },
          46: { shell: 32, sunken_boat: 30 },
          47: { shell: 35, gold_doubloon: 33, sunken_boat: 28 },
          48: { shell: 32, gold_doubloon: 32 },
          49: { shell: 32, gold_doubloon: 34, sunken_boat: 28 },
          50: { shell: 45, gold_doubloon: 52, sunken_boat: 40 },
          51: { shell: 32, gold_doubloon: 33, sunken_boat: 28 },
          52: { shell: 30, sunken_boat: 30 },
          53: { shell: 58, gold_doubloon: 48, sunken_boat: 38 },
          54: { shell: 30, gold_doubloon: 32 },
          55: { shell: 30, sunken_boat: 28 },
          56: { shell: 30, gold_doubloon: 33 },
          57: { shell: 28, sunken_boat: 30 },
          58: { shell: 28, gold_doubloon: 34, sunken_boat: 28 },
          59: { shell: 28, gold_doubloon: 35, sunken_boat: 30 },
          60: { shell: 45, gold_doubloon: 55, sunken_boat: 42 },
          61: { shell: 30, gold_doubloon: 35, sunken_boat: 30 },
          62: { shell: 28, sunken_boat: 30 },
          63: { shell: 28, gold_doubloon: 34 },
          64: { shell: 58, gold_doubloon: 50, sunken_boat: 40 },
          65: { shell: 28, gold_doubloon: 33 },
          66: { shell: 28, sunken_boat: 30 },
          67: { shell: 27, gold_doubloon: 33, sunken_boat: 28 },
          68: { shell: 60, gold_doubloon: 52, sunken_boat: 42 },
          69: { shell: 27, sunken_boat: 30 },
          70: { shell: 45, gold_doubloon: 58, sunken_boat: 45 },
          71: { shell: 28, gold_doubloon: 35, sunken_boat: 30 },
          72: { shell: 26, sunken_boat: 30 },
          73: { shell: 26, gold_doubloon: 34 },
          74: { shell: 58, gold_doubloon: 52, sunken_boat: 42 },
          75: { shell: 26, gold_doubloon: 34, sunken_boat: 28 },
          76: { shell: 26, sunken_boat: 30 },
          77: { shell: 26, gold_doubloon: 33 },
          78: { shell: 58, gold_doubloon: 54, sunken_boat: 44 },
          79: { shell: 26, gold_doubloon: 34, sunken_boat: 28 },
          80: { shell: 50, gold_doubloon: 60, sunken_boat: 50 },
          81: { shell: 28, gold_doubloon: 36, sunken_boat: 30 },
          82: { shell: 26, sunken_boat: 30 },
          83: { shell: 26, gold_doubloon: 35 },
          84: { shell: 60, gold_doubloon: 55, sunken_boat: 45 },
          85: { shell: 26, gold_doubloon: 35 },
          86: { shell: 26, sunken_boat: 30 },
          87: { shell: 25, gold_doubloon: 34 },
          88: { shell: 58, gold_doubloon: 55, sunken_boat: 45 },
          89: { shell: 25, gold_doubloon: 34, sunken_boat: 28 },
          90: { shell: 52, gold_doubloon: 62, sunken_boat: 52 },
          91: { shell: 28, gold_doubloon: 36, sunken_boat: 30 },
          92: { shell: 26, sunken_boat: 30 },
          93: { shell: 25, gold_doubloon: 35 },
          94: { shell: 62, gold_doubloon: 58, sunken_boat: 48 },
          95: { shell: 25, gold_doubloon: 35, sunken_boat: 28 },
          96: { shell: 25, sunken_boat: 30 },
          97: { shell: 25, gold_doubloon: 36 },
          98: { shell: 25, gold_doubloon: 36, sunken_boat: 30 },
          99: { shell: 25, gold_doubloon: 38, sunken_boat: 32 },
          100: { shell: 55, gold_doubloon: 70, sunken_boat: 60 }
        };
      }
      const LEVEL_OBJECT_WEIGHTS = this.levelObjectWeights!;

      const LEVEL_HAZARD_WEIGHTS: Record<number, Partial<Record<FishClass, number>>> = {
        17: { shark_skeleton: 25 },
        18: { shark_skeleton: 20, whirlpool: 35 },
        19: { shark_skeleton: 30, whirlpool: 45 },
        20: { shark_skeleton: 35, whirlpool: 55 },
        25: { shark_skeleton: 22 },
        26: { shark_skeleton: 40 },
        27: { whirlpool: 65 },
        30: { shark_skeleton: 38, whirlpool: 60 },
        31: { shark_skeleton: 28, whirlpool: 38 },
        33: { shark_skeleton: 35, whirlpool: 42 },
        35: { shark_skeleton: 35, whirlpool: 45 },
        36: { shark_skeleton: 38, whirlpool: 48 },
        37: { shark_skeleton: 35, whirlpool: 42 },
        39: { shark_skeleton: 42, whirlpool: 55 },
        40: { shark_skeleton: 45, whirlpool: 65 },
        41: { shark_skeleton: 42, whirlpool: 55 },
        42: { shark_skeleton: 55 },
        43: { shark_skeleton: 45, whirlpool: 55 },
        45: { shark_skeleton: 45, whirlpool: 60 },
        46: { shark_skeleton: 50, whirlpool: 62 },
        47: { shark_skeleton: 42, whirlpool: 55 },
        48: { shark_skeleton: 48, whirlpool: 65 },
        49: { shark_skeleton: 52, whirlpool: 68 },
        50: { shark_skeleton: 55, whirlpool: 75 },
        51: { shark_skeleton: 50, whirlpool: 65 },
        52: { shark_skeleton: 52, whirlpool: 67 },
        54: { shark_skeleton: 52, whirlpool: 68 },
        55: { shark_skeleton: 48, whirlpool: 60 },
        56: { shark_skeleton: 50, whirlpool: 70 },
        57: { shark_skeleton: 54, whirlpool: 70 },
        58: { shark_skeleton: 55, whirlpool: 72 },
        59: { shark_skeleton: 57, whirlpool: 74 },
        60: { shark_skeleton: 60, whirlpool: 80 },
        61: { shark_skeleton: 55, whirlpool: 72 },
        62: { shark_skeleton: 55, whirlpool: 72 },
        63: { shark_skeleton: 55, whirlpool: 72 },
        65: { shark_skeleton: 58, whirlpool: 75 },
        66: { shark_skeleton: 58, whirlpool: 75 },
        67: { shark_skeleton: 60, whirlpool: 76 },
        69: { shark_skeleton: 60, whirlpool: 76 },
        70: { shark_skeleton: 65, whirlpool: 85 },
        71: { shark_skeleton: 60, whirlpool: 78 },
        72: { shark_skeleton: 62, whirlpool: 78 },
        73: { shark_skeleton: 62, whirlpool: 78 },
        75: { shark_skeleton: 63, whirlpool: 80 },
        76: { shark_skeleton: 63, whirlpool: 80 },
        77: { shark_skeleton: 80, whirlpool: 78 },
        78: { shark_skeleton: 30, whirlpool: 40 },
        79: { shark_skeleton: 65, whirlpool: 82 },
        80: { shark_skeleton: 68, whirlpool: 88 },
        81: { shark_skeleton: 65, whirlpool: 82 },
        82: { shark_skeleton: 65, whirlpool: 83 },
        85: { shark_skeleton: 65, whirlpool: 83 },
        87: { shark_skeleton: 67, whirlpool: 84 },
        88: { shark_skeleton: 35, whirlpool: 45 },
        89: { shark_skeleton: 70, whirlpool: 86 },
        90: { shark_skeleton: 72, whirlpool: 90 },
        91: { shark_skeleton: 70, whirlpool: 86 },
        93: { shark_skeleton: 72, whirlpool: 87 },
        95: { shark_skeleton: 73, whirlpool: 88 },
        97: { shark_skeleton: 75, whirlpool: 90 },
        98: { shark_skeleton: 76, whirlpool: 90 },
        99: { shark_skeleton: 77, whirlpool: 91 },
        100: { shark_skeleton: 80, whirlpool: 95 }
      };

      const spawnWeights = LEVEL_SPAWN_WEIGHTS[this.state.level] ?? {};
      const isLucky = this.state.boosters?.lucky;

      for (const [type, weight] of Object.entries(spawnWeights) as Array<[FishClass, number]>) {
        let w = weight;
        if (w > 0) {
          const rareTypes: FishClass[] = ['zap', 'candy', 'moon', 'lava', 'leaf', 'crystal', 'galaxy', 'mushroom', 'king'];
          if (isLucky && rareTypes.includes(type as FishClass)) {
            w *= 1.2;
          }
          pool.push({ type: type as FishClass, weight: w });
        }
      }

      const objectWeights = LEVEL_OBJECT_WEIGHTS[this.state.level];
      if (objectWeights?.shell) {
        pool.push({ type: 'shell', weight: objectWeights.shell });
      }
      if (objectWeights?.sunken_boat) {
        pool.push({ type: 'sunken_boat', weight: objectWeights.sunken_boat });
      }
      if (objectWeights?.gold_doubloon) {
        const activeDoubloonCount = this.state.fishes.filter(f => f.type === 'gold_doubloon').length;
        if (activeDoubloonCount < 1) {
          pool.push({ type: 'gold_doubloon', weight: objectWeights.gold_doubloon });
        }
      }

      const hazardWeights = LEVEL_HAZARD_WEIGHTS[this.state.level];
      if (hazardWeights?.whirlpool) {
        pool.push({ type: 'whirlpool', weight: hazardWeights.whirlpool });
      }
      if (hazardWeights?.shark_skeleton) {
        let skChance = hazardWeights.shark_skeleton;
        if (this.state.activeCurse === 'skeleton_army' || this.state.activeCurse === 'final_1') {
          skChance += 80;
        }
        pool.push({ type: 'shark_skeleton', weight: skChance });
      }

      const total = pool.reduce((sum, item) => sum + item.weight, 0);

      let fishClass: FishClass | null = null;
      let attempts = 0;

      // Retry loop to prevent consecutive duplicates
      do {
        let roll = Math.random() * total;
        fishClass = pool[0].type;
        for (const entry of pool) {
          roll -= entry.weight;
          if (roll <= 0) {
            fishClass = entry.type;
            break;
          }
        }
        attempts++;
      } while (fishClass === this.lastSpawnedType && attempts < 5);

      this.lastSpawnedType = fishClass;

      const assetConfig = OBJECT_MATRIX[fishClass];
      const name = assetConfig.names[Math.floor(Math.random() * assetConfig.names.length)];
      const color = assetConfig.colors[Math.floor(Math.random() * assetConfig.colors.length)];

      const speed = 1.0 * assetConfig.speedMultiplier;

      // Spawn Y position logic — depth zones from spec
      const waterDepth = CANVAS_HEIGHT - FISH_ZONE_TOP - 60; // total water column (above sand)
      let y;
      if (fishClass === 'coral' || fishClass === 'sunken_boat' || fishClass === 'anchor' || fishClass === 'gold_doubloon' || fishClass === 'shell' || fishClass === 'sea_kelp') {
        y = CANVAS_HEIGHT - 20;
      } else if (fishClass === 'sea_rock') {
        y = Math.random() < 0.5 ? CANVAS_HEIGHT - 20 : FISH_ZONE_TOP + 100 + Math.random() * 200;
      } else if (fishClass === 'whirlpool') {
        y = FISH_ZONE_TOP + waterDepth * 0.2 + Math.random() * waterDepth * 0.4; // orta zon
      } else if (fishClass === 'bubble') {
        y = FISH_ZONE_TOP + Math.random() * waterDepth * 0.25; // 0-25%
      } else if (fishClass === 'sakura') {
        y = FISH_ZONE_TOP + Math.random() * waterDepth * 0.4; // 0-40%
      } else if (fishClass === 'zap') {
        y = FISH_ZONE_TOP + Math.random() * waterDepth * 0.9; // 0-90%
      } else if (fishClass === 'candy') {
        y = FISH_ZONE_TOP + waterDepth * 0.2 + Math.random() * waterDepth * 0.4; // 20-60%
      } else if (fishClass === 'moon') {
        y = FISH_ZONE_TOP + waterDepth * 0.4 + Math.random() * waterDepth * 0.4; // 40-80%
      } else if (fishClass === 'lava') {
        y = FISH_ZONE_TOP + waterDepth * 0.6 + Math.random() * waterDepth * 0.35; // 60-95%
      } else if (fishClass === 'crystal') {
        y = FISH_ZONE_TOP + waterDepth * 0.55 + Math.random() * waterDepth * 0.35; // 55-90%
      } else if (fishClass === 'tide') {
        y = FISH_ZONE_TOP + Math.random() * waterDepth * 0.5; // 0-50%
      } else if (fishClass === 'mushroom') {
        y = FISH_ZONE_TOP + waterDepth * 0.35 + Math.random() * waterDepth * 0.5; // 35-85%
      } else if (fishClass === 'king') {
        y = FISH_ZONE_TOP + waterDepth * 0.3 + Math.random() * waterDepth * 0.4; // 30-70%
      } else if (fishClass === 'leaf' || fishClass === 'galaxy') {
        y = FISH_ZONE_TOP + Math.random() * waterDepth * 0.95; // 0-95%
      } else {
        y = FISH_ZONE_TOP + 50 + Math.random() * (CANVAS_HEIGHT - FISH_ZONE_TOP - 150);
      }

      let finalSpeed = speed;
      let finalWeight = assetConfig.weightMultiplier;
      let finalValue = assetConfig.value;

      // Dynamic value scaling specifically for Gold Doubloon
      if (fishClass === 'gold_doubloon') {
        const lv = this.state.level;
        if (lv <= 10) finalValue = 25;
        else if (lv <= 20) finalValue = 45;
        else if (lv <= 35) finalValue = 70;
        else if (lv <= 50) finalValue = 100;
        else if (lv <= 70) finalValue = 140;
        else if (lv <= 90) finalValue = 185;
        else finalValue = 240;
      }

      let finalDir: 1 | -1 = -1;
      let xOffset = CANVAS_WIDTH + 100; // Default spawn from right

      const curse = this.state.activeCurse;

      // Speed multipliers
      if (curse === 'fast_current' || curse === 'combo_1' || curse === 'combo_3' || curse === 'final_2') {
        finalSpeed *= 1.5;
      }

      // Weight multipliers
      if (curse === 'heavy_waters' || curse === 'combo_1' || curse === 'combo_3') {
        finalWeight *= 1.5;
      }

      // Value multipliers (Economic Crisis)
      if (curse === 'economic_crisis' || curse === 'combo_2' || curse === 'combo_3') {
        finalValue *= 0.7;
      }

      // Reverse current: %30 chance they go from left to right instead of right to left
      if (curse === 'reverse_current' && Math.random() < 0.3) {
        finalDir = 1;
        xOffset = -100; // Spawn from left
      }

      this.state.fishes.push({
        id: Math.random(),
        type: fishClass,
        name,
        x: finalDir === -1 ? CANVAS_WIDTH + 100 : -100, // Çıkış yönü
        y,
        startY: y,
        animationOffset: Math.random() * 1000,
        speed: finalSpeed,
        value: Math.round(finalValue),
        weight: finalWeight,
        color,
        radius: assetConfig.radius,
        direction: finalDir
      });
    }
  }

  private buildTutorialEntity(type: FishClass, x: number, y: number): Entity {
    const assetConfig = OBJECT_MATRIX[type];
    const name = assetConfig.names[0];
    const color = assetConfig.colors[0];
    const direction: 1 | -1 = -1;
    const speed = Math.max(assetConfig.speedMultiplier, 1.1);
    return {
      id: Math.random(),
      type,
      name,
      x,
      y,
      startY: y,
      animationOffset: Math.random() * 1000,
      speed,
      value: assetConfig.value,
      weight: assetConfig.weightMultiplier,
      color,
      radius: assetConfig.radius,
      direction
    };
  }

  private getTutorialSpawnY(type: FishClass) {
    const waterDepth = CANVAS_HEIGHT - FISH_ZONE_TOP - 60;
    if (type === 'coral' || type === 'sunken_boat' || type === 'anchor' || type === 'gold_doubloon' || type === 'shell' || type === 'sea_kelp') {
      return CANVAS_HEIGHT - 20;
    }
    if (type === 'sea_rock') {
      return Math.random() < 0.5 ? CANVAS_HEIGHT - 20 : FISH_ZONE_TOP + 100 + Math.random() * 200;
    }
    if (type === 'whirlpool') {
      return FISH_ZONE_TOP + waterDepth * 0.2 + Math.random() * waterDepth * 0.4;
    }
    if (type === 'bubble') {
      return FISH_ZONE_TOP + Math.random() * waterDepth * 0.25;
    }
    if (type === 'sakura') {
      return FISH_ZONE_TOP + Math.random() * waterDepth * 0.4;
    }
    if (type === 'zap') {
      return FISH_ZONE_TOP + Math.random() * waterDepth * 0.9;
    }
    if (type === 'candy') {
      return FISH_ZONE_TOP + waterDepth * 0.2 + Math.random() * waterDepth * 0.4;
    }
    if (type === 'moon') {
      return FISH_ZONE_TOP + waterDepth * 0.4 + Math.random() * waterDepth * 0.4;
    }
    if (type === 'lava') {
      return FISH_ZONE_TOP + waterDepth * 0.6 + Math.random() * waterDepth * 0.35;
    }
    if (type === 'crystal') {
      return FISH_ZONE_TOP + waterDepth * 0.55 + Math.random() * waterDepth * 0.35;
    }
    if (type === 'tide') {
      return FISH_ZONE_TOP + Math.random() * waterDepth * 0.5;
    }
    if (type === 'mushroom') {
      return FISH_ZONE_TOP + waterDepth * 0.35 + Math.random() * waterDepth * 0.5;
    }
    if (type === 'king') {
      return FISH_ZONE_TOP + waterDepth * 0.3 + Math.random() * waterDepth * 0.4;
    }
    if (type === 'leaf' || type === 'galaxy') {
      return FISH_ZONE_TOP + Math.random() * waterDepth * 0.95;
    }
    return FISH_ZONE_TOP + 50 + Math.random() * (CANVAS_HEIGHT - FISH_ZONE_TOP - 150);
  }

  private getTutorialTargetCenter() {
    const tutorial = this.tutorialManager?.getState();
    if (!tutorial || tutorial.targetFishIds.length === 0) return null;
    const targets = this.state.fishes.filter(fish => tutorial.targetFishIds.includes(fish.id));
    if (targets.length === 0) return null;
    const sum = targets.reduce((acc, fish) => ({ x: acc.x + fish.x, y: acc.y + fish.y }), { x: 0, y: 0 });
    return { x: sum.x / targets.length, y: sum.y / targets.length };
  }

  private ensureAmbientBubbles() {

    // game_design Bölüm 3: Baloncuk sayısı level'e göre azalır
    // L1-2: 3, L3-8: 2, L9-12: 1-2, L13-14: 1 (nadir), L15-16: 0-1, L17+: 0
    const lv = this.state.level;
    let targetBubbles: number;
    if (lv <= 2) targetBubbles = 3;
    else if (lv <= 8) targetBubbles = 2;
    else if (lv <= 12) targetBubbles = Math.random() < 0.6 ? 2 : 1;
    else if (lv <= 14) targetBubbles = Math.random() < 0.3 ? 1 : 0;
    else if (lv <= 16) targetBubbles = Math.random() < 0.2 ? 1 : 0;
    else targetBubbles = 0; // L17-20: hiç baloncuk yok

    const bubbleCount = this.state.fishes.filter(fish => fish.type === 'env_bubbles').length;
    if (bubbleCount >= targetBubbles) return;
    const needed = targetBubbles - bubbleCount;
    for (let i = 0; i < needed; i++) {
      const config = OBJECT_MATRIX.env_bubbles;
      const y = CANVAS_HEIGHT - 20;
      const x = 20 + Math.random() * (CANVAS_WIDTH - 40);
      this.state.fishes.push({
        id: Math.random(),
        type: 'env_bubbles',
        name: config.names[0],
        x,
        y,
        startY: y,
        animationOffset: Math.random() * 1000,
        speed: config.speedMultiplier,
        value: config.value,
        weight: config.weightMultiplier,
        color: config.colors[0],
        radius: config.radius,
        direction: -1
      });
    }
  }

  private updateHookAttempts(delta: number) {
    const rod = this.getRodStats();
    const next = Math.max(0, Math.min(rod.maxAttempts, this.state.hookAttempts + delta));
    this.state.hookAttempts = next;

    if (next === 0 && !this.isArriving && !this.isSinking) {
      this.state.isPlaying = false;
      this.onGameOver(this.state.score, this.state.level, "Fishing rod unusable! All hooks are broken.");
    }
  }

  private triggerHookBreak() {
    const breakX = this.state.hook.x;
    const breakY = this.state.hook.y;
    this.state.hookBrokenMs = this.hookBreakDuration;
    this.state.hook.state = 'idle';
    this.state.hook.length = 0;
    const hookPivot = this.getHookPivotPosition();
    this.state.hook.x = hookPivot.x;
    this.state.hook.y = hookPivot.y;
    this.effects.spawnHookBreak(breakX, breakY);
  }

  private applyBubbleEffect() {
    this.state.hookSpeedBoostMs = 5000;
    this.state.buoyancyOffset = -3;
    this.state.buoyancyOffsetMs = 5000;
    this.recalculateStorage();
  }

  private applyValueMultiplier(multiplier: number) {
    this.state.valueMultiplier *= multiplier;
    this.state.inventory = this.state.inventory.map(item => ({
      ...item,
      value: Math.round(item.value * multiplier)
    }));
  }

  private addInventoryItem(item: { id: string; type: FishClass; name: string; value: number; weight: number }, ignoreWeight: boolean = false) {
    // Value Booster: 20% more value for catches
    const boosterMultiplier = this.state.boosters?.value ? 1.2 : 1.0;
    const finalValue = Math.round(item.value * boosterMultiplier);

    const newItem = { ...item, value: finalValue, weight: ignoreWeight ? 0 : item.weight };
    this.state.inventory.push(newItem);
    this.recalculateStorage();
  }

  private handleStandardCatch(caught: Entity, ignoreWeight: boolean = false, storeCatch: boolean = true) {
    let value = caught.value;
    if (caught.type === 'crystal') {
      const roll = Math.random();
      if (roll < 0.4) value += 50;
      else if (roll < 0.6) value -= 30;
    }

    // 'fish_escape' veya 'final_3' curse: Yakalanan balık %30 şansla kaçar
    const curse = this.state.activeCurse;
    if ((curse === 'fish_escape' || curse === 'final_3') && Math.random() < 0.3) {
      this.effects.shakeScreen(5, 5);
      this.effects.spawnSplash(caught.x, caught.y);
      return; // Fish escaped, do not add to inventory
    }

    if (this.state.level === 1 && this.tutorialManager?.isActive()) {
      markTutorialCatch(caught.type);
    }

    if (storeCatch) {
      const adjustedValue = Math.round(value * this.state.valueMultiplier);
      this.addInventoryItem({
        id: Math.random().toString(),
        type: caught.type,
        name: caught.name,
        value: adjustedValue,
        weight: caught.weight
      }, ignoreWeight);
    }

    // 'chain_reaction' veya 'final_2' curse: Pull nearby fishes as well
    if (storeCatch && (this.state.activeCurse === 'chain_reaction' || this.state.activeCurse === 'final_2')) {
      const CHAIN_RADIUS = 80;
      const nearby = this.state.fishes.filter(f => {
        if (f.id === caught.id) return false;
        const dist = Math.sqrt(Math.pow(f.x - caught.x, 2) + Math.pow(f.y - caught.y, 2));
        return dist < CHAIN_RADIUS;
      });

      for (const extra of nearby) {
        // Only pull real fishes (not objects)
        const isActuallyFish = !OBJECT_MATRIX[extra.type].isObstacle && (extra.type !== 'env_bubbles' && extra.type !== 'shell' && extra.type !== 'gold_doubloon' && extra.type !== 'sunken_boat' && extra.type !== 'anchor');
        if (isActuallyFish) {
          const extraValue = Math.round(extra.value * this.state.valueMultiplier);
          this.addInventoryItem({
            id: Math.random().toString(),
            type: extra.type,
            name: extra.name,
            value: extraValue,
            weight: extra.weight
          }, ignoreWeight);
          // Ekran efekti
          this.effects.spawnSplash(extra.x, extra.y);
          // Delete fish from world
          this.state.fishes = this.state.fishes.filter(f => f.id !== extra.id);
        }
      }
    }

    // Effects: Trigger different effects based on value
    const baseValue = OBJECT_MATRIX[caught.type].value;
    if (baseValue < 50) {
      this.effects.spawnSmallCatch(caught.x, caught.y, caught.color);
    } else if (baseValue <= 200) {
      this.effects.spawnMediumCatch(caught.x, caught.y, caught.color);
    } else {
      this.effects.spawnRareCatch(caught.x, caught.y, caught.color, caught.type === 'king');
    }

    if (!this.isSinking) {
      this.onFishCaught(caught);
    }

    if (storeCatch && caught.type === 'leaf' && this.state.leafBonusStacks < 3) {
      this.state.leafBonusStacks += 1;
      this.applyValueMultiplier(1.1);
    }

    if (storeCatch && caught.type === 'candy' && this.state.candyBonusStacks < 3) {
      this.state.candyBonusStacks += 1;
      this.state.inventory = this.state.inventory.map(item => ({
        ...item,
        weight: Math.max(0, item.weight - 1)
      }));
      this.recalculateStorage();
    }

    if (storeCatch && caught.type === 'king') {
      this.applyValueMultiplier(1.2);
    }

    if (caught.type === 'galaxy') {
      const roll = Math.random();
      if (roll < 0.3) this.earnCoins(100);
      else if (roll < 0.6) this.state.fuelCost = Math.max(10, Math.floor(this.state.fuelCost * 0.9));
    }

    if (storeCatch && caught.type === 'mushroom' && this.state.inventory.length > 0) {
      const idx = Math.floor(Math.random() * this.state.inventory.length);
      const item = this.state.inventory[idx];
      this.state.inventory[idx] = { ...item, value: item.value * 2 };
    }

    // Zap: 3 second electric shock — next catches have 50% escape chance
    if (caught.type === 'zap') {
      this.state.zapShockMs = 3000;
    }

    // Moon: 10 second all-fish slowdown (40% speed reduction)
    if (caught.type === 'moon') {
      this.state.moonSlowMs = Math.max(this.state.moonSlowMs, 0) + 10000;
    }

    // Lava: yangın etkisi — Tekne Lv3 ise 3sn, diğer durumlarda 5sn (game_design Bölüm 7.1)
    if (caught.type === 'lava') {
      this.state.lavaBurnMs = this.state.upgrades.boatLevel >= 3 ? 3000 : 5000;
      this.state.weightDisplayOffset = 0; // reset visual offset
      this.state.weightDisplayOffsetMs = 0;
    }

    // Tide: visual shake + 20% chance to drop random fish from inventory
    if (caught.type === 'tide') {
      this.state.weightDisplayOffset = 5;
      this.state.weightDisplayOffsetMs = 2000;
      if (storeCatch && this.state.inventory.length > 1 && Math.random() < 0.2) {
        // Drop a random fish from inventory (not the tide fish we just added)
        const candidates = this.state.inventory.filter(item => item.type !== 'tide');
        if (candidates.length > 0) {
          const dropIdx = this.state.inventory.indexOf(candidates[Math.floor(Math.random() * candidates.length)]);
          if (dropIdx >= 0) {
            this.state.inventory.splice(dropIdx, 1);
            this.recalculateStorage();
          }
        }
      }
    }
  }

  private handleTreasureChest(caught: Entity, storeCatch: boolean = true) {
    if (storeCatch) {
      this.addInventoryItem({
        id: Math.random().toString(),
        type: 'gold_doubloon',
        name: caught.name,
        value: 0,
        weight: 8
      });
    }

    this.earnCoins(80 + Math.floor(Math.random() * 121));

    if (storeCatch && Math.random() < 0.6) {
      const bonusType: FishClass = Math.random() < 0.5 ? 'crystal' : 'galaxy';
      const config = OBJECT_MATRIX[bonusType];
      let value = config.value;
      if (bonusType === 'crystal') {
        const roll = Math.random();
        if (roll < 0.4) value += 50;
        else if (roll < 0.6) value -= 30;
      }
      if (storeCatch) {
        this.addInventoryItem({
          id: Math.random().toString(),
          type: bonusType,
          name: config.names[0],
          value: Math.round(value * this.state.valueMultiplier),
          weight: config.weightMultiplier
        });
      }
    }

    if (Math.random() < 0.2) {
      this.state.hookAttempts = this.getRodStats().maxAttempts;
    }

    if (!this.isSinking) {
      this.onFishCaught(caught);
    }
  }

  private handleSunkenBoat(caught: Entity, storeCatch: boolean = true) {
    if (this.state.level === 1 && this.tutorialManager?.isActive()) {
      markTutorialCatch('sunken_boat');
    }

    if (storeCatch) {
      this.addInventoryItem({
        id: Math.random().toString(),
        type: 'sunken_boat',
        name: caught.name,
        value: 0,
        weight: 5
      });
    }

    let roll = Math.random();
    if (this.activeVehicleId === 't9' && roll >= 0.95) {
      roll = 0.5;
    }
    if (roll < 0.35) {
      const fishCount = 1 + Math.floor(Math.random() * 3);
      if (storeCatch) {
        for (let i = 0; i < fishCount; i++) {
          const type: FishClass = Math.random() < 0.5 ? 'bubble' : 'sakura';
          const config = OBJECT_MATRIX[type];
          this.addInventoryItem({
            id: Math.random().toString(),
            type,
            name: config.names[0],
            value: Math.round(config.value * this.state.valueMultiplier),
            weight: config.weightMultiplier
          });
        }
      }
    } else if (roll < 0.6) {
      this.earnCoins(50 + Math.floor(Math.random() * 71));
      const type: FishClass = Math.random() < 0.5 ? 'tide' : 'candy';
      const config = OBJECT_MATRIX[type];
      if (storeCatch) {
        this.addInventoryItem({
          id: Math.random().toString(),
          type,
          name: config.names[0],
          value: Math.round(config.value * this.state.valueMultiplier),
          weight: config.weightMultiplier
        });
      }
    } else if (roll < 0.8) {
    } else if (roll < 0.95) {
      const type: FishClass = Math.random() < 0.5 ? 'moon' : 'lava';
      const config = OBJECT_MATRIX[type];
      if (storeCatch) {
        this.addInventoryItem({
          id: Math.random().toString(),
          type,
          name: config.names[0],
          value: Math.round(config.value * this.state.valueMultiplier),
          weight: config.weightMultiplier
        });
      }
    } else {
      this.earnCoins(-10);
    }

    if (!this.isSinking) {
      this.onFishCaught(caught);
    }
  }

  private handleShell(caught: Entity, storeCatch: boolean = true) {
    // Shell game_design Bölüm 3.4: Direk 20 coin verir, inventory'ye girmez
    this.earnCoins(20);
    if (this.state.level === 1 && this.tutorialManager?.isActive()) {
      markTutorialCatch('shell');
    }

    if (storeCatch && Math.random() < 0.25) {
      const type: FishClass = Math.random() < 0.5 ? 'bubble' : 'sakura';
      const config = OBJECT_MATRIX[type];
      this.addInventoryItem({
        id: Math.random().toString(),
        type,
        name: config.names[0],
        value: Math.round(config.value * this.state.valueMultiplier),
        weight: config.weightMultiplier
      });
    }

    if (!this.isSinking) {
      this.onFishCaught(caught);
    }
  }

  private checkIslandProgress() {
    // Moved logic to update isArriving
  }

  private darkenColor(hex: string, amount: number) {
    const value = hex.replace('#', '');
    const num = parseInt(value, 16);
    const r = Math.max(0, ((num >> 16) & 255) - amount);
    const g = Math.max(0, ((num >> 8) & 255) - amount);
    const b = Math.max(0, (num & 255) - amount);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  }

  private drawWeatherEffects(bx: CanvasRenderingContext2D) {
    if (this.state.weather === 'cloudy') {
      bx.fillStyle = 'rgba(0,0,0,0.08)';
      bx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (this.state.weather === 'rainy' || this.state.weather === 'stormy') {
      bx.fillStyle = this.state.weather === 'stormy' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.12)';
      bx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      bx.strokeStyle = 'rgba(180,220,255,0.6)';
      bx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        bx.beginPath();
        bx.moveTo(x, y);
        bx.lineTo(x + 4, y + 10);
        bx.stroke();
      }
    } else if (this.state.weather === 'magic') {
      bx.fillStyle = 'rgba(123,31,162,0.12)';
      bx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  /**
   * Draw all static background elements onto bgCtx.
   * Called only when backgroundDirty === true (level start, assets load, arrival, sinking).
   */
  private drawBackground(bgCtx: CanvasRenderingContext2D) {
    bgCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const islandConfig = LEVEL_CONFIG[this.state.level];
    const hue = (this.state.level - 1) * 30;
    const skyTop = islandConfig?.skyColor ?? '#87CEEB';
    const skyBottom = this.darkenColor(skyTop, 20);
    const seaTop = islandConfig?.seaColor ?? '#29B6F6';
    const seaBottom = this.darkenColor(seaTop, 40);

    // Sky gradient
    const skyGradient = bgCtx.createLinearGradient(0, 0, 0, SEA_LEVEL_Y);
    skyGradient.addColorStop(0, skyTop);
    skyGradient.addColorStop(1, skyBottom);
    bgCtx.fillStyle = skyGradient;
    bgCtx.fillRect(0, 0, CANVAS_WIDTH, SEA_LEVEL_Y);

    if (this.state.weather === 'sunny' || this.state.weather === 'cloudy') {
      this.drawSun(bgCtx, CANVAS_WIDTH - 60, 50);
    }
    if (this.state.weather !== 'magic') {
      this.drawCloud(bgCtx, 60, 40, 40);
      this.drawCloud(bgCtx, 150, 60, 30);
      this.drawCloud(bgCtx, 300, 45, 35);
    }

    // Sea gradient
    const seaGradient = bgCtx.createLinearGradient(0, SEA_LEVEL_Y, 0, CANVAS_HEIGHT);
    seaGradient.addColorStop(0, seaTop);
    seaGradient.addColorStop(1, seaBottom);
    bgCtx.fillStyle = seaGradient;

    // Static sea surface (no wave animation — saves CPU per frame)
    bgCtx.beginPath();
    bgCtx.moveTo(0, SEA_LEVEL_Y);
    bgCtx.lineTo(CANVAS_WIDTH, SEA_LEVEL_Y);
    bgCtx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
    bgCtx.lineTo(0, CANVAS_HEIGHT - 20);
    bgCtx.closePath();
    bgCtx.fill();

    this.drawWeatherEffects(bgCtx);

    // Bottom Sand (Flat 2D line)
    bgCtx.beginPath();
    bgCtx.moveTo(0, CANVAS_HEIGHT - 20);
    bgCtx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
    bgCtx.strokeStyle = 'hsl(40, 100%, 80%)';
    bgCtx.lineWidth = 4;
    bgCtx.stroke();

    // Bottom Bedrock Fill
    bgCtx.fillStyle = '#3e2723';
    bgCtx.fillRect(0, CANVAS_HEIGHT - 18, CANVAS_WIDTH, 18);
    // Boss Level Golden Aura (her 10. level — x1.5 çarpan görsel işareti)
    if (this.state.level % 10 === 0) {
      const goldGradient = bgCtx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.7
      );
      goldGradient.addColorStop(0, 'rgba(255, 215, 0, 0.07)');
      goldGradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.05)');
      goldGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
      bgCtx.fillStyle = goldGradient;
      bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Golden frame (border glow)
      bgCtx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      bgCtx.lineWidth = 6;
      bgCtx.strokeRect(3, 3, CANVAS_WIDTH - 6, CANVAS_HEIGHT - 6);
    }
  }

  private drawBottomBedrock(bgCtx: CanvasRenderingContext2D) {
    // Bottom Sand (Flat 2D line)
    bgCtx.beginPath();
    bgCtx.moveTo(0, CANVAS_HEIGHT - 20);
    bgCtx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
    bgCtx.strokeStyle = 'hsl(40, 100%, 80%)';
    bgCtx.lineWidth = 4;
    bgCtx.stroke();

    // Bottom Bedrock Fill
    bgCtx.fillStyle = '#3e2723';
    bgCtx.fillRect(0, CANVAS_HEIGHT - 18, CANVAS_WIDTH, 18);
  }

  private drawBossAura(bgCtx: CanvasRenderingContext2D) {
    // Boss Level Golden Aura (her 10. level — x1.5 çarpan görsel işareti)
    if (this.state.level % 10 === 0) {
      const goldGradient = bgCtx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.7
      );
      goldGradient.addColorStop(0, 'rgba(255, 215, 0, 0.07)');
      goldGradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.05)');
      goldGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
      bgCtx.fillStyle = goldGradient;
      bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Golden frame (border glow)
      bgCtx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      bgCtx.lineWidth = 6;
      bgCtx.strokeRect(3, 3, CANVAS_WIDTH - 6, CANVAS_HEIGHT - 6);
    }
  }

  /**
   * Helper to draw image covering the target area (like CSS background-size: cover)
   */
  private drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = w / h;

    let sourceX = 0;
    let sourceY = 0;
    let sourceW = img.naturalWidth;
    let sourceH = img.naturalHeight;

    if (imgRatio > targetRatio) {
      // Image is wider than target: crop width
      sourceW = sourceH * targetRatio;
      sourceX = (img.naturalWidth - sourceW) / 2;
    } else {
      // Image is taller than target: crop height
      sourceH = sourceW / targetRatio;
      sourceY = (img.naturalHeight - sourceH) / 2;
    }

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, x, y, w, h);
  }

  private draw(timestamp: number = 0) {
    const bx = this.bgCtx;

    // Draw background only when needed (level change, arrival, sinking)
    const needsBgRedraw = this.backgroundDirty || this.isArriving || this.isSinking;
    if (needsBgRedraw) {
      if (!this.isArriving && !this.isSinking) {
        // Static scene — draw once and cache
        this.drawBackground(bx);
        this.backgroundDirty = false;
      } else {
        // Arrival / Sinking scenes change every frame — keep dirty but redraw each frame
        this.drawBackground(bx);
        this.drawArrivalOrSinking(bx);
      }
    }

    // Level start text moved to end of draw for proper clearing

    // ── Game Canvas (dynamic objects) ────────────────────────────────────────
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const t = timestamp * 0.001; // seconds

    // Ambient: boat water swing
    const boatBobY = Math.sin(t * 0.04 * 60) * 2.5 + this.effects.boatBobY;
    const boatRotation = Math.sin(t * 0.035 * 60) * (0.8 * Math.PI / 180);

    // Ambient: olta ucu mikro titreme
    const rodTweak = this.effects.applyRodTipAmbientation(timestamp);

    // ── Whirlpool DOM element (GPU CSS transform) ─────────────────────────────
    if (this.whirlpoolEl) {
      const wp = this.activeWhirlpool;
      if (wp) {
        const spin = timestamp * 0.004;
        const scaleY = 0.55 + Math.sin(spin) * 0.35;
        // Compute canvas-relative pixel position for the DOM overlay
        const canvasEl = this.ctx.canvas;
        const scaleX = canvasEl.offsetWidth / CANVAS_WIDTH;
        const scaleYCanvas = canvasEl.offsetHeight / CANVAS_HEIGHT;
        const pxW = 110 * scaleX;
        const pxH = 110 * scaleYCanvas;
        const pxX = wp.x * scaleX - pxW / 2;
        const pxY = wp.y * scaleYCanvas - pxH / 2;
        this.whirlpoolEl.style.display = 'block';
        this.whirlpoolEl.style.width = `${pxW}px`;
        this.whirlpoolEl.style.height = `${pxH}px`;
        this.whirlpoolEl.style.left = `${pxX}px`;
        this.whirlpoolEl.style.top = `${pxY}px`;
        this.whirlpoolEl.style.transform = `rotate(${spin}rad) scaleY(${scaleY})`;
      } else {
        this.whirlpoolEl.style.display = 'none';
      }
    }

    // 3. Draw Boat & Fisherman (Screen Shake + Zoom transform burada uygulanıyor)
    this.ctx.save();
    // Zoom pulse (nadir balık)
    const zoom = this.effects.currentZoom;
    if (zoom !== 1) {
      this.ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      this.ctx.scale(zoom, zoom);
      this.ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
    }
    // Screen shake
    this.effects.applyShake(this.ctx);

    // Boat ambient swing
    if (this.isArriving) {
      this.ctx.translate(this.arrivalProgress * 100, boatBobY);
    } else if (this.isSinking) {
      this.ctx.translate(0, this.sinkProgress * 200 + boatBobY);
      this.ctx.rotate(this.sinkProgress * 0.2);
    } else {
      this.ctx.translate(0, boatBobY);
      this.ctx.translate(CANVAS_WIDTH / 2, SEA_LEVEL_Y - 40);
      this.ctx.rotate(boatRotation);
      this.ctx.translate(-CANVAS_WIDTH / 2, -(SEA_LEVEL_Y - 40));
    }

    // Detailed Boat
    const boatSprite = this.spriteManager.getImage('boat');
    if (boatSprite) {
      this.ctx.drawImage(boatSprite, CANVAS_WIDTH / 2 - 60, SEA_LEVEL_Y - 20, 120, 60);
    } else {
      this.ctx.fillStyle = '#D4A373';
      this.ctx.strokeStyle = '#5c2d0c';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(CANVAS_WIDTH / 2 - 60, SEA_LEVEL_Y);
      this.ctx.bezierCurveTo(CANVAS_WIDTH / 2 - 60, SEA_LEVEL_Y + 40, CANVAS_WIDTH / 2 + 60, SEA_LEVEL_Y + 40, CANVAS_WIDTH / 2 + 60, SEA_LEVEL_Y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.drawFisherman();
    this.drawFishingRod();

    // Draw Hook Line
    const rod = this.getRodStats();
    const rodTip = this.getRodTipPosition();
    const tipX = rodTip.x + rodTweak.dx;
    const tipY = rodTip.y + rodTweak.dy;

    const hookPivot = this.getHookPivotPosition();
    const pivotX = hookPivot.x;
    const pivotY = hookPivot.y;

    if (this.state.hook.state === 'tnt_aiming' && this.state.hook.targetX !== undefined && this.state.hook.targetY !== undefined) {
      const isTutorialTnt = this.state.level === 1 && this.tutorialManager?.getState().step === 'tnt_action';
      const gridSize = 240; // 120 radius Explosion area = 240px width/height
      const cellSize = gridSize / 3;
      const tntX = this.state.hook.targetX - gridSize / 2;
      const tntY = this.state.hook.targetY - gridSize / 2;

      if (!isTutorialTnt) {
        this.ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
        this.ctx.fillRect(tntX, tntY, gridSize, gridSize);

        this.ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        // Verticals
        this.ctx.moveTo(tntX + cellSize, tntY);
        this.ctx.lineTo(tntX + cellSize, tntY + gridSize);
        this.ctx.moveTo(tntX + cellSize * 2, tntY);
        this.ctx.lineTo(tntX + cellSize * 2, tntY + gridSize);

        // Horizontals
        this.ctx.moveTo(tntX, tntY + cellSize);
        this.ctx.lineTo(tntX + gridSize, tntY + cellSize);
        this.ctx.moveTo(tntX, tntY + cellSize * 2);
        this.ctx.lineTo(tntX + gridSize, tntY + cellSize * 2);

        // Outer Border
        this.ctx.rect(tntX, tntY, gridSize, gridSize);
        this.ctx.stroke();
      }

      // TNT Icon in center
      const iconSize = 40;
      this.ctx.fillStyle = isTutorialTnt ? '#666' : '#444';
      this.ctx.beginPath();
      this.ctx.arc(this.state.hook.targetX, this.state.hook.targetY, iconSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#FF5555';
      this.ctx.fillRect(this.state.hook.targetX - 4, this.state.hook.targetY - iconSize / 2 - 8, 8, 8);
    }

    if (this.state.hook.state === 'aiming') {
      // Semi-transparent aiming semicircle
      this.ctx.fillStyle = 'rgba(65, 105, 225, 0.15)';
      this.ctx.beginPath();
      this.ctx.arc(pivotX, pivotY, 150, 0, Math.PI);
      this.ctx.fill();

      // Harpoon arrow
      const aimLength = 120;
      const arrX = pivotX - Math.cos(this.state.hook.angle) * aimLength;
      const arrY = pivotY + Math.sin(this.state.hook.angle) * aimLength;

      this.ctx.strokeStyle = '#4169E1';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(pivotX, pivotY);
      this.ctx.lineTo(arrX, arrY);
      this.ctx.stroke();

      // Arrow head
      this.ctx.beginPath();
      this.ctx.moveTo(arrX, arrY);
      this.ctx.lineTo(arrX + Math.cos(this.state.hook.angle - 0.15) * 20, arrY - Math.sin(this.state.hook.angle - 0.15) * 20);
      this.ctx.lineTo(arrX + Math.cos(this.state.hook.angle + 0.15) * 20, arrY - Math.sin(this.state.hook.angle + 0.15) * 20);
      this.ctx.closePath();
      this.ctx.fillStyle = '#4169E1';
      this.ctx.fill();
    } else if (this.state.hookBrokenMs > 0) {
      const midX = tipX + Math.cos(this.state.hook.angle) * 30;
      const midY = tipY + Math.sin(this.state.hook.angle) * 30;
      this.ctx.strokeStyle = '#D64545';
      this.ctx.lineWidth = rod.lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(tipX, tipY);
      this.ctx.lineTo(midX, midY);
      this.ctx.stroke();
    } else if (this.state.hook.state !== 'tnt_aiming') {
      const isHarpoon = this.state.hook.state === 'harpoon';
      const isNet = this.state.hook.state === 'net';

      this.ctx.strokeStyle = isHarpoon ? '#888' : (isNet ? '#fff' : '#D64545');
      this.ctx.lineWidth = isHarpoon ? 5 : (isNet ? 2 : rod.lineWidth);

      this.ctx.beginPath();
      this.ctx.moveTo(tipX, tipY);
      this.ctx.lineTo(pivotX, pivotY);
      this.ctx.stroke();

      this.ctx.lineTo(this.state.hook.x, this.state.hook.y);
      this.ctx.stroke();

      this.drawHookHead(this.state.hook.x, this.state.hook.y, Math.max(1.5, this.ctx.lineWidth));
    }

    if (this.state.hook.caughtEntity && this.state.hook.state !== 'tnt_aiming') {
      const entity = this.state.hook.caughtEntity;
      if (entity.type === 'sunken_boat') {
        this.drawEntity(entity.x, entity.y, entity.radius, entity.color, entity.type, false, entity);
      } else {
        entity.x = this.state.hook.x;
        entity.y = this.state.hook.y + 15;
        this.drawEntity(entity.x, entity.y, entity.radius, entity.color, entity.type, true, entity);
      }
    }

    const anchorSprite = this.spriteManager.getImage('booster_anchor');
    if (this.anchorVisualState !== 'inactive' && anchorSprite && anchorSprite.complete && anchorSprite.naturalWidth > 0) {
      const { x: attachX, y: attachY } = this.getAnchorAttachPoint();
      const width = 120;
      const height = width * (anchorSprite.naturalHeight / anchorSprite.naturalWidth);
      const anchorTopY = this.anchorVisualY - height + 24;
      const ropeEndY = anchorTopY + 8;

      if (this.anchorVisualState !== 'drifting') {
        this.ctx.strokeStyle = '#5c2d0c';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(attachX, attachY);
        this.ctx.lineTo(this.anchorVisualX, ropeEndY);
        this.ctx.stroke();
      }

      this.ctx.drawImage(anchorSprite, this.anchorVisualX - width / 2, anchorTopY, width, height);
    }

    this.ctx.restore();

    // 8. Draw Swimming Entities (whirlpool drawn via DOM element, skip here)
    const slowHoldIntensity = this.getHoldSlowIntensity();
    this.ctx.save();
    if (slowHoldIntensity > 0) {
      this.effects.applySlowMotionEffect(this.ctx, slowHoldIntensity);
    }
    this.effects.drawUnder(this.ctx);
    for (const fish of this.state.fishes) {
      if (this.state.hook.caughtEntity && this.state.hook.caughtEntity.id === fish.id) continue;
      if (fish.type === 'whirlpool') continue;
      if (fish.x < -120 || fish.x > CANVAS_WIDTH + 120 || fish.y < SEA_LEVEL_Y - 120 || fish.y > CANVAS_HEIGHT + 120) continue;

      const curse = this.state.activeCurse;
      const isObstacle = OBJECT_MATRIX[fish.type].isObstacle;
      const isActuallyFish = !isObstacle && fish.type !== 'env_bubbles' && fish.type !== 'shell' && fish.type !== 'gold_doubloon' && fish.type !== 'sunken_boat' && fish.type !== 'anchor' && fish.type !== 'shark_skeleton';

      if (curse === 'dark_matter' && isObstacle) continue;
      if ((curse === 'invisible_fish' || curse === 'final_1') && isActuallyFish) continue;

      this.drawEntity(fish.x, fish.y, fish.radius, fish.color, fish.type, false, fish);
    }
    this.ctx.restore();

    // 'blind_spot' curse: Dark overlay at the top
    if (this.state.activeCurse === 'blind_spot') {
      const waterHeight = CANVAS_HEIGHT - SEA_LEVEL_Y;
      const darkHeight = waterHeight * 0.4;
      const gradient = this.ctx.createLinearGradient(0, SEA_LEVEL_Y, 0, SEA_LEVEL_Y + darkHeight);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, SEA_LEVEL_Y, CANVAS_WIDTH, darkHeight);
    }

    // 9. Efektler (particles, flash overlay)
    this.effects.draw(this.ctx);

    // 10. Vignette (last 10 seconds)
    if (this.state.timeRemaining <= 10) {
      const intensity = Math.max(0, 1 - this.state.timeRemaining / 10);
      this.effects.drawVignette(this.ctx, intensity);
    }

    this.drawLevelStartOverlay(this.ctx);
  }

  /** Draw island arrival animation onto bgCtx (replaces static background while arriving) */
  private drawArrivalOrSinking(bx: CanvasRenderingContext2D) {
    const islandConfig = LEVEL_CONFIG[this.state.level];
    const hue = (this.state.level - 1) * 30;

    if (this.isArriving) {
      const progress = Math.min(1, this.arrivalProgress);
      const islandWidth = CANVAS_WIDTH * 0.6;
      const islandX = CANVAS_WIDTH - (progress * islandWidth);

      const sandGradient = bx.createLinearGradient(islandX, SEA_LEVEL_Y, CANVAS_WIDTH, CANVAS_HEIGHT);
      sandGradient.addColorStop(0, '#FFE082');
      sandGradient.addColorStop(0.4, '#FFD54F');
      sandGradient.addColorStop(1, '#FFCA28');

      bx.fillStyle = sandGradient;
      bx.beginPath();
      bx.moveTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      bx.lineTo(islandX - 100, CANVAS_HEIGHT);
      bx.bezierCurveTo(islandX - 50, CANVAS_HEIGHT, islandX, SEA_LEVEL_Y + 100, islandX + 20, SEA_LEVEL_Y);
      bx.bezierCurveTo(islandX + 40, SEA_LEVEL_Y - 30, CANVAS_WIDTH - 50, SEA_LEVEL_Y - 60, CANVAS_WIDTH, SEA_LEVEL_Y - 50);
      bx.closePath();
      bx.fill();

      bx.fillStyle = `hsl(${100 + hue}, 60%, 45%)`;
      bx.beginPath();
      bx.moveTo(islandX + 20, SEA_LEVEL_Y);
      bx.quadraticCurveTo(islandX + 60, SEA_LEVEL_Y - 40, CANVAS_WIDTH, SEA_LEVEL_Y - 20);
      bx.lineTo(CANVAS_WIDTH, SEA_LEVEL_Y);
      bx.closePath();
      bx.fill();

    }


  }

  private drawLevelStartOverlay(bx: CanvasRenderingContext2D) {
    // Show overlay during the initial startTimerMs (0.75 seconds)
    if (this.state.startTimerMs <= 0) return;

    const elapsed = 750 - this.state.startTimerMs;
    const totalDuration = 750;

    let alpha = 1;
    if (elapsed < 200) {
      alpha = elapsed / 200;
    } else if (elapsed > 550) {
      alpha = 1 - (elapsed - 550) / 200;
    }
    if (alpha <= 0) return;

    bx.save();
    bx.globalAlpha = alpha;

    const levelName = LEVEL_NAMES[this.state.level] ?? `Level ${this.state.level}`;
    const x = CANVAS_WIDTH / 2;
    const y = CANVAS_HEIGHT / 2;
    const maxWidth = CANVAS_WIDTH * 0.9;

    let fontSize = 52;
    bx.font = `bold ${fontSize}px Fredoka`;
    let width = bx.measureText(levelName).width;
    while (width > maxWidth && fontSize > 16) {
      fontSize -= 3;
      bx.font = `bold ${fontSize}px Fredoka`;
      width = bx.measureText(levelName).width;
    }

    bx.textAlign = 'center';
    bx.textBaseline = 'middle';
    bx.fillStyle = '#FFD700';
    bx.shadowColor = '#FF8C00';
    bx.shadowBlur = 20;
    bx.fillText(levelName, x, y);

    bx.restore();
  }

  private drawSun(bx: CanvasRenderingContext2D, x: number, y: number) {
    bx.fillStyle = '#FFD700';
    bx.strokeStyle = '#FFA500';
    bx.lineWidth = 3;
    bx.beginPath();
    bx.arc(x, y, 25, 0, Math.PI * 2);
    bx.fill();
    bx.stroke();

    bx.fillStyle = '#333';
    bx.beginPath();
    bx.arc(x - 8, y - 5, 2, 0, Math.PI * 2);
    bx.arc(x + 8, y - 5, 2, 0, Math.PI * 2);
    bx.fill();
    bx.beginPath();
    bx.arc(x, y + 5, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    bx.stroke();
  }

  private drawCloud(bx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    const safeRadius = Math.max(1, Math.abs(r));
    bx.fillStyle = '#FFFFFF';
    bx.beginPath();
    bx.arc(x, y, safeRadius, 0, Math.PI * 2);
    bx.arc(x + safeRadius, y - safeRadius / 2, safeRadius * 0.8, 0, Math.PI * 2);
    bx.arc(x - safeRadius, y - safeRadius / 2, safeRadius * 0.8, 0, Math.PI * 2);
    bx.fill();
  }

  private readonly BOAT_DISPLAY_WIDTH = 180;
  private readonly BOAT_WATERLINE_RATIO = 0.72;

  private getActiveVehicle(): VehicleData {
    if (this.activeVehicleData) return this.activeVehicleData;
    const fallback = VEHICLES.find(v => v.id === this.activeVehicleId) ?? VEHICLES[0];
    this.activeVehicleId = fallback.id;
    this.activeVehicleData = fallback;
    return fallback;
  }

  private getBoatRenderMetrics() {
    const vehicle = this.getActiveVehicle();
    const displayWidth = this.BOAT_DISPLAY_WIDTH;
    const scale = displayWidth / vehicle.sprite.nativeWidth;
    const displayHeight = vehicle.sprite.nativeHeight * scale;
    const drawX = CANVAS_WIDTH / 2 - displayWidth / 2;
    const drawY = SEA_LEVEL_Y - displayHeight * this.BOAT_WATERLINE_RATIO;
    const spriteKey = `boat_${vehicle.id}`;
    return { vehicle, displayWidth, displayHeight, drawX, drawY, spriteKey };
  }

  private getRodTipPosition(): { x: number; y: number } {
    const { vehicle, drawX, drawY, displayWidth } = this.getBoatRenderMetrics();
    return getRodTipOnCanvas(vehicle, drawX, drawY, displayWidth);
  }

  private getHookPivotPosition(): { x: number; y: number } {
    const { drawX, drawY, displayWidth, displayHeight } = this.getBoatRenderMetrics();
    return {
      x: drawX + displayWidth / 2,
      y: drawY + displayHeight
    };
  }

  private drawFisherman() {
    const { drawX, drawY, displayWidth, displayHeight, spriteKey } = this.getBoatRenderMetrics();
    const sprite = this.spriteManager.getImage(spriteKey);
    if (!sprite || !sprite.complete || sprite.naturalWidth === 0) {
      this.drawFishermanFallback();
      return;
    }

    this.ctx.save();
    // PNG transparanlığını kullanmak için source-over (varsayılan) kullanılır.
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(sprite, drawX, drawY, displayWidth, displayHeight);
    this.ctx.restore();
  }

  private drawFishermanFallback() {
    // Sprite yüklenemezse eski procedural çizim (yedek)
    const x = CANVAS_WIDTH / 2;
    const y = SEA_LEVEL_Y - 40;
    this.ctx.fillStyle = '#D4A373';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 10, 30, 18, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#4A90D9';
    this.ctx.beginPath();
    this.ctx.roundRect(x - 14, y - 10, 28, 22, 6);
    this.ctx.fill();
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - 25, 22, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawFishingRod() {
    // Sprite kullanıldığında ayrı olta çubuğu çizmiyoruz —
    // olta çubuğu zaten sprite içinde. Bu fonksiyon boş bırakıldı.
    // (Fallback modunda çizim aşağıda yapılır)
    const { spriteKey } = this.getBoatRenderMetrics();
    const sprite = this.spriteManager.getImage(spriteKey);
    if (!sprite || !sprite.complete || sprite.naturalWidth === 0) {
      // Fallback: procedural rod
      const x = CANVAS_WIDTH / 2;
      const y = SEA_LEVEL_Y - 40;
      const rodLength = 40;
      const rod = this.getRodStats();
      // Launch animasyonu scale (mechanical.md 1.1)
      let launchScale = 1;
      if (this.hookLaunchMs > 0) {
        const t = 1 - (this.hookLaunchMs / 250);
        // 0 -> 1.4 -> 1.0 (overshoot)
        if (t < 0.6) launchScale = (t / 0.6) * 1.4;
        else launchScale = 1.4 - ((t - 0.6) / 0.4) * 0.4;
      }

      this.ctx.save();
      this.ctx.translate(x, y);

      // Scaling effect for large objects when caught
      if (this.state.hook.caughtEntity && ['gold_doubloon', 'anchor', 'sunken_boat', 'sea_rock_large'].includes(this.state.hook.caughtEntity.type)) {
        this.ctx.scale(0.6, 0.6);
      }
      this.ctx.scale(launchScale, launchScale);
      this.ctx.rotate(this.state.hook.angle - Math.PI / 2);
      this.ctx.strokeStyle = '#8B4513';
      this.ctx.lineWidth = rod.rodWidth;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(0, rodLength);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private drawHookHead(x: number, y: number, lineWidth: number) {
    const hookState = this.state.hook.state;

    if (hookState === 'harpoon') {
      // Draw Harpoon Tip
      this.ctx.fillStyle = '#AAA';
      this.ctx.strokeStyle = '#555';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y - 15);
      this.ctx.lineTo(x - 5, y);
      this.ctx.lineTo(x + 5, y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Barbs
      this.ctx.beginPath();
      this.ctx.moveTo(x - 3, y - 8);
      this.ctx.lineTo(x - 10, y - 5);
      this.ctx.moveTo(x + 3, y - 8);
      this.ctx.lineTo(x + 10, y - 5);
      this.ctx.stroke();
      return;
    }

    if (hookState === 'tnt') {
      // Draw TNT Bomb
      this.ctx.fillStyle = '#D32F2F';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 12, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Fuse
      this.ctx.strokeStyle = '#5D4037';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y - 12);
      this.ctx.quadraticCurveTo(x + 5, y - 18, x + 2, y - 22);
      this.ctx.stroke();

      // Spark
      if (Math.random() > 0.3) {
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(x + 2, y - 22, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      return;
    }

    if (hookState === 'net') {
      const progress = Math.min(1, performance.now() % 1000 / 1000);
      const radius = 30 * (1 - progress * 0.2); // Shrink effect? Or just a pulse

      this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Net mesh
      this.ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      }
      this.ctx.stroke();
      return;
    }

    this.ctx.strokeStyle = '#777';
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.arc(x, y - 5, 8, 0, Math.PI * 0.8);
    this.ctx.stroke();

    // Bait detail
    this.ctx.fillStyle = '#FF6347';
    this.ctx.beginPath();
    this.ctx.arc(x + 5, y - 2, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawEntity(x: number, y: number, radius: number, color: string, type: FishClass, isCaught: boolean = false, fish?: Entity) {
    if (fish && (fish.type === 'zap' || fish.type === 'tide' || fish.type === 'king')) {
      this.effects.drawTrail(this.ctx, fish.id, radius);
    }
    if (type === 'galaxy' && !isCaught && fish && this.isGalaxyHidden(fish)) {
      return;
    }
    const safeRadius = Math.max(1, Math.abs(radius));
    this.ctx.save();
    const time = performance.now() * 0.005;
    const wobble = isCaught ? 0 : Math.sin(time + x * 0.05) * 5;

    // Position handling
    // Static objects shouldn't wobble and should be pivoted at bottom
    const isStatic = type === 'coral' || type === 'sea_kelp' || type === 'sea_rock' || type === 'sea_rock_large' || type === 'anchor' || type === 'shell' || type === 'gold_doubloon' || type === 'sunken_boat';

    if (isStatic) {
      this.ctx.translate(x, y);
    } else if (type === 'sea_kelp_horizontal') {
      this.ctx.translate(x, y);
      this.ctx.rotate(-Math.PI / 2); // 90 degree left rotate
    } else {
      this.ctx.translate(x, y + wobble);
    }

    if (isCaught && type !== 'shell') this.ctx.rotate(Math.PI / 2);

    // Try to draw sprite if available
    const spriteKey = `fish_${type}`;
    const sprite = this.spriteManager.getImage(spriteKey);
    const hasSprite = Boolean(sprite && sprite.complete && sprite.naturalWidth > 0);

    if (hasSprite && sprite) {
      // Draw sprite
      // Increase size multiplier for better visibility
      let width = safeRadius * 4.5;
      let height = safeRadius * 4.5;
      let offsetX = -width / 2;
      let offsetY = -height / 2;

      // Custom dimensions for sprite drawing
      // Use natural aspect ratio to prevent flattening/distortion
      const ratio = sprite.naturalWidth / sprite.naturalHeight || 1;

      if (type === 'bubble') {
        // Target height: 72px (approx 2x original assumption)
        height = 72;
        width = height * ratio;

        offsetX = -width / 2;
        offsetY = -height / 2;
      } else if (type === 'sakura') {
        // Target height: 80px (approx 2x original assumption)
        height = 80;
        width = height * ratio;

        offsetX = -width / 2;
        offsetY = -height / 2;

        // Particle effect
        if (!isCaught && Math.random() < 0.05) {
          this.ctx.fillStyle = '#FFB7C5';
          this.ctx.beginPath();
          this.ctx.arc(-10 + Math.random() * 20, -10 + Math.random() * 20, 2, 0, Math.PI * 2);
          this.ctx.fill();
        }

      } else if (type === 'zap' || type === 'candy' || type === 'moon' || type === 'lava' || type === 'crystal' || type === 'leaf' || type === 'tide' || type === 'mushroom' || type === 'king' || type === 'galaxy') {
        height = 80;
        if (type === 'king') height = 100;
        if (type === 'galaxy') height = 90;
        width = height * ratio;

        offsetX = -width / 2;
        offsetY = -height / 2;
      } else if (type === 'coral') {
        height = 104;
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = -height; // Draw upwards from pivot

        const scaleTime = performance.now() * 0.002;
        const scaleY = 1.0 + Math.sin(scaleTime) * 0.03;
        this.ctx.scale(1, scaleY);
      } else if (type === 'sea_kelp' || type === 'sea_kelp_horizontal') {
        height = 100;
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = type === 'sea_kelp_horizontal' ? -height / 2 : -height;

        // Sway effect
        const sway = Math.sin(performance.now() * 0.002) * (type === 'sea_kelp_horizontal' ? 0.02 : 0.05);
        this.ctx.rotate(sway);
      } else if (type === 'sea_rock' || type === 'sea_rock_large') {
        height = type === 'sea_rock' ? 40 : 120;
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = -height; // Sit directly on sand
      } else if (type === 'gold_doubloon') {
        height = 64; // +100% size
        width = 64 * ratio;
        offsetX = -width / 2;
        offsetY = -height; // Pivot bottom

      } else if (type === 'whirlpool') {
        height = 110;
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = -height / 2; // Center pivot
        const spin = performance.now() * 0.004;
        const scaleY = 0.55 + Math.sin(spin) * 0.35;
        this.ctx.rotate(spin);
        this.ctx.scale(1, scaleY);
      } else if (type === 'sunken_boat') {
        height = 120;
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = -height; // Sit flush with sand
      } else if (type === 'shark_skeleton') {
        height = 60;
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = -height / 2;
      } else if (type === 'env_bubbles') {
        height = 30;
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = -height / 2;
      } else if (type === 'anchor') {
        height = 120; // 2x
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = -height; // Pivot bottom
      } else if (type === 'shell') {
        height = 80;
        width = height * ratio;
        offsetX = -width / 2;
        offsetY = isCaught ? 0 : -height; // Sit exactly on the hook when caught, otherwise pivot bottom
      }

      if (type === 'candy' && !isCaught && Math.random() < 0.08) {
        const colors = ['#FFB3C6', '#FFD6A5', '#BDE0FE'];
        this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        this.ctx.beginPath();
        this.ctx.arc(-10 + Math.random() * 20, -10 + Math.random() * 20, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      if (type === 'gold_doubloon') {
        // Calculate creation time for pop-in animation
        const spawnAlpha = fish?.startY ? Math.min(1, (time * 200 - fish.startY) * 0.003) : 1;
        const popScale = spawnAlpha < 1 ? (Math.sin(spawnAlpha * Math.PI) * 0.2 + spawnAlpha) : 1;

        this.ctx.scale(popScale, popScale);
        this.ctx.drawImage(sprite, offsetX, offsetY, width, height);

        // Removed glow effect upon user request
      } else {
        this.ctx.drawImage(sprite, offsetX, offsetY, width, height);
      }
    } else {
      // Fallback to procedural drawing
      this.drawProceduralEntity(safeRadius, color, type, time);
    }

    this.ctx.restore();
  }

  private getEntityRect(entity: Entity): { x: number; y: number; width: number; height: number } {
    const config = OBJECT_MATRIX[entity.type];
    const ratio = config.aspectRatio || 1;
    let height = entity.radius * 4.5;
    const isStatic = entity.type === 'coral' || entity.type === 'sea_kelp' || entity.type === 'sea_rock' || entity.type === 'sea_rock_large' || entity.type === 'anchor' || entity.type === 'shell' || entity.type === 'gold_doubloon' || entity.type === 'sunken_boat';

    // Match drawEntity logic constants
    if (entity.type === 'bubble') height = 72;
    else if (entity.type === 'sakura') height = 80;
    else if (['zap', 'candy', 'moon', 'lava', 'crystal', 'leaf', 'tide', 'mushroom', 'king', 'galaxy'].includes(entity.type)) {
      height = 80;
      if (entity.type === 'king') height = 100;
      if (entity.type === 'galaxy') height = 90;
    } else if (entity.type === 'coral') height = 104;
    else if (entity.type === 'sea_kelp' || entity.type === 'sea_kelp_horizontal') height = 100;
    else if (entity.type === 'sea_rock') height = 40;
    else if (entity.type === 'sea_rock_large') height = 120;
    else if (entity.type === 'gold_doubloon') height = 64;
    else if (entity.type === 'whirlpool') height = 110;
    else if (entity.type === 'sunken_boat') height = 120;
    else if (entity.type === 'shark_skeleton') height = 60;
    else if (entity.type === 'env_bubbles') height = 30;
    else if (entity.type === 'anchor') height = 120;
    else if (entity.type === 'shell') height = 80;

    const width = height * ratio;

    // Calculate top-left based on pivot
    let rectX = entity.x - width / 2;
    let rectY = entity.y - height / 2;

    if (isStatic || entity.type === 'sea_kelp_horizontal') {
      if (entity.type === 'sea_kelp_horizontal') {
        // Rotated 90 deg left: width becomes height, height becomes width
        // drawEntity logic: offsetX = -width/2, offsetY = -height/2, Rotate -90
        const realW = height;
        const realH = width;
        rectX = entity.x - realW / 2;
        rectY = entity.y - realH / 2;
        return { x: rectX, y: rectY, width: realW, height: realH };
      }

      // Pivot is bottom for most static objects perfectly flush with sand
      rectY = entity.y - height;
    }

    return { x: rectX, y: rectY, width, height };
  }

  private isGalaxyHidden(fish: Entity) {
    const timeMs = performance.now();
    const cycle = 1200 + ((fish.animationOffset || 0) % 800);
    const phase = (timeMs + (fish.animationOffset || 0) * 1000) % cycle;
    return phase < 100;
  }

  private getAnchorAttachPoint() {
    const { drawX, drawY, displayWidth, displayHeight } = this.getBoatRenderMetrics();
    const x = drawX + displayWidth * 0.78;
    const y = drawY + displayHeight * this.BOAT_WATERLINE_RATIO - 6;
    return { x, y };
  }

  private updateAnchorVisual(deltaTime: number) {
    const { x: attachX, y: attachY } = this.getAnchorAttachPoint();
    if (this.state.anchorEffectTimerMs > 0) {
      if (this.anchorVisualState === 'inactive' || this.anchorVisualState === 'drifting') {
        this.anchorDropElapsed = 0;
        this.anchorVisualState = 'dropping';
      }
      this.anchorDropElapsed += deltaTime;
      const targetY = CANVAS_HEIGHT - 60;
      if (this.anchorDropElapsed < 1000) {
        const t = this.anchorDropElapsed / 1000;
        this.anchorVisualY = attachY + (targetY - attachY) * (t * t);
        this.anchorVisualState = 'dropping';
      } else {
        this.anchorVisualY = targetY;
        this.anchorVisualState = 'resting';
      }
      this.anchorVisualX = attachX;
      return;
    }

    if (this.anchorVisualState === 'dropping' || this.anchorVisualState === 'resting') {
      const levelSpeedBonus = (this.state.level - 1) * 0.1;
      this.anchorDriftSpeed = 1.6 + levelSpeedBonus * 0.4;
      this.anchorVisualState = 'drifting';
    }

    if (this.anchorVisualState === 'drifting') {
      this.anchorVisualX -= this.anchorDriftSpeed * (deltaTime / 16);
      this.anchorVisualY += Math.sin(performance.now() * 0.004) * 0.2;
      if (this.anchorVisualX < -200) {
        this.anchorVisualState = 'inactive';
      }
    }
  }

  private getHoldSlowIntensity() {
    return this.isPointerDown && (this.state.hook.state === 'tnt_aiming' || this.state.hook.state === 'aiming' || this.state.anchorEffectTimerMs > 0) ? 1 : 0;
  }

  private getHoldSlowFactor() {
    return this.getHoldSlowIntensity() > 0 ? 0.6 : 1;
  }

  private drawProceduralEntity(radius: number, color: string, type: FishClass, time: number) {
    // Dynamic Shadow based on depth
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = 'rgba(0,0,0,0.25)';

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2.5;

    const fishGrad = this.ctx.createRadialGradient(-radius * 0.6, -radius * 0.6, 0, 0, 0, radius * 2);
    fishGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
    fishGrad.addColorStop(0.3, color);
    fishGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
    this.ctx.fillStyle = fishGrad;

    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, radius * 1.5, radius, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -radius);
    this.ctx.bezierCurveTo(radius * 0.5, -radius * 1.8, radius * 1.2, -radius * 1.5, radius, -radius * 0.5);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(radius * 1.2, 0);
    this.ctx.bezierCurveTo(radius * 2.2, -radius * 1.2, radius * 2.2, radius * 1.2, radius * 1.2, 0);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(-radius * 0.75, -radius * 0.2, 7.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.arc(-radius * 0.75, -radius * 0.2, 4.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(-radius * 0.85, -radius * 0.35, 2.5, 0, Math.PI * 2);
    this.ctx.arc(-radius * 0.65, -radius * 0.1, 1.2, 0, Math.PI * 2);
    this.ctx.arc(-radius * 0.75, 0, 0.8, 0, Math.PI * 2);
    this.ctx.fill();

    const blushGrad = this.ctx.createRadialGradient(-radius * 0.4, 0, 0, -radius * 0.4, 0, 6);
    blushGrad.addColorStop(0, 'rgba(255, 100, 150, 0.5)');
    blushGrad.addColorStop(1, 'rgba(255, 100, 150, 0)');
    this.ctx.fillStyle = blushGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(-radius * 0.4, 0, 6, 3, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fillStyle = 'white';
    this.ctx.fill();
  }
}
