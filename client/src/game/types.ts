import { t } from "@/lib/i18n";

export type FishClass = 'bubble' | 'sakura' | 'zap' | 'candy' | 'moon' | 'lava' | 'crystal' | 'leaf' | 'tide' | 'mushroom' | 'king' | 'galaxy' | 'coral' | 'sea_kelp' | 'sea_kelp_horizontal' | 'sea_rock' | 'sea_rock_large' | 'gold_doubloon' | 'whirlpool' | 'sunken_boat' | 'shark_skeleton' | 'env_bubbles' | 'anchor' | 'shell';

// Curse System: Special rules activated every 10 levels
export type CurseType =
  | 'none'              // No curse (normal level)
  | 'heavy_waters'      // All fish weights x1.5
  | 'fast_current'      // All fish speeds x1.5
  | 'blind_spot'        // Surface invisible (top 40% of water = dark overlay)
  | 'reverse_current'   // 30% fish go right
  | 'double_damage'     // Coral hits -2 hearts
  | 'economic_crisis'   // All fish values 70% (30% lower)
  | 'countdown'         // Capacity melts -5 every 10s
  | 'skeleton_army'     // Skeleton spawn chance 80%
  | 'fish_escape'       // 30% chance fish escapes when caught
  | 'time_bomb'         // Random inventory item cleared every 8s
  | 'dark_matter'       // Obstacles invisible
  | 'chain_reaction'    // Caught fish pulls nearby fish
  | 'invisible_fish'    // Fish invisible
  | 'reverse_market'    // Market prices reversed (Sell 50% lower, Buy 50% higher)
  | 'random_loop'       // Hook swing speed changes constantly
  | 'reverse_weight'    // Weight indicator reversed
  | 'random_curse'      // Curse changes every 15s
  | 'combo_1'           // Heavy Waters + Fast Current
  | 'combo_2'           // Economic Crisis + Double Damage
  | 'combo_3'           // Heavy Waters + Fast Current + Economic Crisis
  | 'final_1'           // Invisible Fish + Skeleton 80% + Double Damage
  | 'final_2'           // Countdown + Chaining + Fast Current
  | 'final_3'           // Reverse Market + Fish Escape
  | 'one_chance';       // Single cast luck (L99)

export interface InventoryItem {
  id: string;
  type: FishClass;
  name: string;
  value: number;
  weight: number; // New property for storage calculation
}

export interface Entity {
  id: number;
  type: FishClass;
  name: string;
  x: number;
  y: number;
  speed: number;
  value: number;
  weight: number;
  color: string;
  radius: number;
  direction: 1 | -1;
  // Specific properties for new entities
  startY?: number; // For sine wave or deviation reference
  animationOffset?: number; // Random seed for animations
  fleeVelocityX?: number;
  fleeVelocityY?: number;
  kingSpeedBoostMs?: number;
}

export interface Hook {
  angle: number;
  length: number;
  state: 'idle' | 'shooting' | 'retracting' | 'whirlpool' | 'snagged' | 'harpoon' | 'harpoon_retracting' | 'tnt' | 'net' | 'aiming' | 'tnt_aiming';
  direction: 1 | -1;
  x: number;
  y: number;
  caughtEntity: Entity | null;
  caughtEntities: Entity[]; // Multiple catches for Premium Harpoon
  targetX?: number; // Target for Harpoon/TNT
  targetY?: number;
  tipX?: number; // Precise golden tip X
  tipY?: number; // Precise golden tip Y
}

export interface GameState {
  score: number;
  level: number; // Renamed from island
  region: number; // New property for 5 regions
  fuelCost: number;
  timeRemaining: number;
  isPlaying: boolean;
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'magic';
  hook: Hook;
  fishes: Entity[];
  inventory: InventoryItem[];
  upgrades: {
    rodLevel: number;
    boatLevel: number;
    hasFuel: boolean;
    storageCapacity: number;
    swingSpeed: number;
    castSpeed: number;
    returnSpeed: number;
    hookDepth: number;
    castAttempts: number;
    coralProtection: number;
    kelpDuration: number;
  };
  currentStorage: number;
  hookAttempts: number;
  maxHookAttempts: number;
  hookSpeedBoostMs: number;
  fishPanicMs: number;
  buoyancyOffset: number;
  buoyancyOffsetMs: number;
  weightDisplayOffset: number;
  weightDisplayOffsetMs: number;
  anchorSnagMs: number;
  hookBrokenMs: number;
  valueMultiplier: number;
  leafBonusStacks: number;
  candyBonusStacks: number;
  zapShockMs: number;
  moonSlowMs: number;
  lavaBurnMs: number;
  activeCurse: CurseType;   // Active curse
  curseTimerMs: number;     // Periodic counter for countdowns / bombs
  isPaused: boolean;        // Game pause state
  isTimeFrozen: boolean;    // For Harpoon/Tutorial freeze effects
  boatX: number;            // Central boat X position
  shakeX: number;           // Screenshake/Hit offset
  boatBob: number;          // Vertical bobbing animation
  hookX: number;            // Current hook Tip X
  hookY: number;            // Current hook Tip Y
  hookRotation: number;     // Hook sprite rotation
  entities: Entity[];       // All active swim/float objects
  coins: number;            // Currency earned in this run
  boosters: {
    speed: boolean;
    lucky: boolean;
    value: boolean;
    harpoon: number;
    net: number;
    tnt: number;
    anchor: number;
  };
  activeBooster: 'harpoon' | 'net' | 'tnt' | 'anchor' | null;
  anchorEffectTimerMs: number;
  startTimerMs: number;
  currentCombo: number; // consecutive catch tracker
}

export const OBJECT_MATRIX: Record<FishClass, {
  names: string[];
  colors: string[];
  speedMultiplier: number;
  weightMultiplier: number;
  value: number;
  radius: number;
  aspectRatio: number; // Width / Height
  isObstacle?: boolean;
}> = {
  bubble: {
    names: [t('entities.bubble.name', 'Bubble Fish')],
    colors: ['#E8F4FD'],
    speedMultiplier: 1.2,
    weightMultiplier: 2,
    value: 8,
    radius: 20,
    aspectRatio: 1.4,
  },
  sakura: {
    names: [t('entities.sakura.name', 'Sakura Fish')],
    colors: ['#FDF0F5'],
    speedMultiplier: 1.5,
    weightMultiplier: 3,
    value: 12,
    radius: 22,
    aspectRatio: 1.6,
  },
  zap: {
    names: [t('entities.zap.name', 'Zap Fish')],
    colors: ['#FFE066'],
    speedMultiplier: 3.5,
    weightMultiplier: 4,
    value: 22,
    radius: 24,
    aspectRatio: 1.5,
  },
  candy: {
    names: [t('entities.candy.name', 'Candy Fish')],
    colors: ['#FFC0CB'],
    speedMultiplier: 1.8,
    weightMultiplier: 5,
    value: 30,
    radius: 23,
    aspectRatio: 1.4,
  },
  moon: {
    names: [t('entities.moon.name', 'Moon Fish')],
    colors: ['#DDE6FF'],
    speedMultiplier: 0.8,
    weightMultiplier: 8,
    value: 55,
    radius: 24,
    aspectRatio: 1.2,
  },
  lava: {
    names: [t('entities.lava.name', 'Lava Fish')],
    colors: ['#FF6B3D'],
    speedMultiplier: 2.0,
    weightMultiplier: 12,
    value: 80,
    radius: 24,
    aspectRatio: 1.5,
  },
  crystal: {
    names: [t('entities.crystal.name', 'Crystal Fish')],
    colors: ['#C9B6FF'],
    speedMultiplier: 2.2,
    weightMultiplier: 18,
    value: 240,
    radius: 24,
    aspectRatio: 1.3,
  },
  leaf: {
    names: [t('entities.leaf.name', 'Leaf Fish')],
    colors: ['#FFA94D'],
    speedMultiplier: 0.6,
    weightMultiplier: 1,
    value: 160,
    radius: 22,
    aspectRatio: 1.7,
  },
  tide: {
    names: [t('entities.tide.name', 'Tide Fish')],
    colors: ['#74C0FC'],
    speedMultiplier: 3.8,
    weightMultiplier: 9,
    value: 110,
    radius: 23,
    aspectRatio: 1.6,
  },
  mushroom: {
    names: [t('entities.mushroom.name', 'Mushroom Fish')],
    colors: ['#E85D75'],
    speedMultiplier: 1.5,
    weightMultiplier: 15,
    value: 520,
    radius: 23,
    aspectRatio: 1.1,
  },
  king: {
    names: [t('entities.king.name', 'King Fish')],
    colors: ['#F3C969'],
    speedMultiplier: 5.5,
    weightMultiplier: 35,
    value: 900,
    radius: 26,
    aspectRatio: 1.8,
  },
  galaxy: {
    names: [t('entities.galaxy.name', 'Galaxy Fish')],
    colors: ['#7C5CFA'],
    speedMultiplier: 4.5,
    weightMultiplier: 7,
    value: 380,
    radius: 25,
    aspectRatio: 1.5,
  },
  coral: {
    names: [t('entities.coral.name', 'Coral Reef')],
    colors: ['#FFF3E0'],
    speedMultiplier: 0, // Static
    weightMultiplier: 999, // Unliftable
    value: 0,
    radius: 30,
    aspectRatio: 1.4, // 72x52
    isObstacle: true,
  },
  sea_kelp: {
    names: [t('entities.sea_kelp.name', 'Sea Kelp')],
    colors: ['#7ED957'],
    speedMultiplier: 0,
    weightMultiplier: 999,
    value: 0,
    radius: 28,
    aspectRatio: 0.4, // Tall
    isObstacle: true,
  },
  sea_kelp_horizontal: {
    names: [t('entities.sea_kelp_horizontal.name', 'Floating Kelp')],
    colors: ['#7ED957'],
    speedMultiplier: 0,
    weightMultiplier: 999,
    value: 0,
    radius: 28,
    aspectRatio: 2.5, // Flipped
    isObstacle: true,
  },
  sea_rock: {
    names: [t('entities.sea_rock.name', 'Sea Rock')],
    colors: ['#8A9AA9'],
    speedMultiplier: 0,
    weightMultiplier: 999,
    value: 0,
    radius: 20, // Smaller for floating ones
    aspectRatio: 1.2,
    isObstacle: true,
  },
  sea_rock_large: {
    names: [t('entities.sea_rock_large.name', 'Large Sea Rock')],
    colors: ['#8A9AA9'],
    speedMultiplier: 0,
    weightMultiplier: 999,
    value: 0,
    radius: 50,
    aspectRatio: 1.4,
    isObstacle: true,
  },
  gold_doubloon: {
    names: [t('entities.gold_doubloon.name', 'Gold Doubloon')],
    colors: ['#FFD700'],
    speedMultiplier: 0.8, // Will float instead of staying static
    weightMultiplier: 10,
    value: 25, // Base value, dynamically calculated on catch
    radius: 32,
    aspectRatio: 1.0,
  },
  whirlpool: {
    names: [t('entities.whirlpool.name', 'Whirlpool')],
    colors: ['#00BFFF'],
    speedMultiplier: 0.8,
    weightMultiplier: 0,
    value: 0,
    radius: 45,
    aspectRatio: 1.0,
    isObstacle: true,
  },
  sunken_boat: {
    names: [t('entities.sunken_boat.name', 'Sunken Boat')],
    colors: ['#8B4513'],
    speedMultiplier: 0,
    weightMultiplier: 15,
    value: 0,
    radius: 60,
    aspectRatio: 2.0,
    isObstacle: true,
  },
  shark_skeleton: {
    names: [t('entities.shark_skeleton.name', 'Shark Skeleton')],
    colors: ['#E0E0E0'],
    speedMultiplier: 0.3,
    weightMultiplier: 4,
    value: -10,
    radius: 40,
    aspectRatio: 2.2,
  },
  env_bubbles: {
    names: [t('entities.env_bubbles.name', 'Bubbles')],
    colors: ['#E0FFFF'],
    speedMultiplier: 1.5,
    weightMultiplier: 0,
    value: 0,
    radius: 15,
    aspectRatio: 1.0,
  },
  anchor: {
    names: [t('entities.anchor.name', 'Rusty Anchor')],
    colors: ['#708090'],
    speedMultiplier: 0,
    weightMultiplier: 10,
    value: 200,
    radius: 60,
    aspectRatio: 0.8,
  },
  shell: {
    names: [t('entities.shell.name', 'Sea Shell')],
    colors: ['#FFEFD5'],
    speedMultiplier: 0,
    weightMultiplier: 0,
    value: 20,
    radius: 22,
    aspectRatio: 1.2,
  }
};
