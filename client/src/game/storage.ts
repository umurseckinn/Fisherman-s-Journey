// ─────────────────────────────────────────────────────────────────────────────
// localStorage persistence layer — from master_prompt.md §6.7
// ─────────────────────────────────────────────────────────────────────────────

import { type FishClass } from "./types";

const K = {
  permanentCoins: 'fj_permanentCoins',
  maxLevelReached: 'fj_maxLevelReached',
  personalBest: 'fj_personalBest',
  activeVehicle: 'fj_activeVehicle',
  selectedStartLevel: 'fj_selectedStartLevel',
  userSelectedStartLevel: 'fj_userSelectedStartLevel',
  userUnlockedLevel: 'fj_userUnlockedLevel',
  adminMode: 'fj_adminMode',
  tutorialCompleted: 'fj_tutorialCompleted',
  rodTutorial: 'fj_rodTutorial',
  storageTutorial: 'fj_storageTutorial',
  boatTutorial: 'fj_boatTutorial',
  vehicleOwned: (id: string) => `fj_vehicle_${id}_owned`,
  vehicleSto: (id: string, n: 1 | 2 | 3 | 4 | 5) => `fj_vehicle_${id}_sto_${n}`,
  vehicleRod: (id: string, n: 1 | 2 | 3 | 4 | 5) => `fj_vehicle_${id}_rod_${n}`,
};

const TUTORIAL_CAUGHT_KEY = 'fj_tutorial_caught';

function getNum(key: string, fallback = 0): number {
  const v = localStorage.getItem(key);
  return v !== null ? Number(v) : fallback;
}
function setNum(key: string, value: number) {
  localStorage.setItem(key, String(value));
}
function getBool(key: string): boolean {
  return localStorage.getItem(key) === 'true';
}
function setBool(key: string, value: boolean) {
  localStorage.setItem(key, value ? 'true' : 'false');
}

export function markTutorialCatch(type: FishClass) {
  const raw = localStorage.getItem(TUTORIAL_CAUGHT_KEY);
  const map = raw ? JSON.parse(raw) : {};
  if (!map[type]) {
    map[type] = true;
    localStorage.setItem(TUTORIAL_CAUGHT_KEY, JSON.stringify(map));
  }
}

export function hasTutorialCaught(type: FishClass): boolean {
  const raw = localStorage.getItem(TUTORIAL_CAUGHT_KEY);
  const map = raw ? JSON.parse(raw) : {};
  return Boolean(map[type]);
}

// ── Permanent Coins ──────────────────────────────────────────────────────────

export function getPermanentCoins(): number {
  return getNum(K.permanentCoins, 0);
}

export function setPermanentCoins(value: number) {
  setNum(K.permanentCoins, Math.max(0, value));
}

/** Called whenever sessionCoins increase. Auto-transfers 100% to permanent. */
export function addSessionEarning(amount: number): number {
  const transfer = amount; // 100% transfer
  if (transfer > 0) {
    setPermanentCoins(getPermanentCoins() + transfer);
  }
  return transfer;
}

// ── Max Level ────────────────────────────────────────────────────────────────

export function getMaxLevelReached(): number {
  return getNum(K.maxLevelReached, 1);
}

export function updateMaxLevelReached(level: number) {
  if (level > getMaxLevelReached()) {
    setNum(K.maxLevelReached, level);
  }
}

// ── Personal Best Score ───────────────────────────────────────────────────────

export function getPersonalBest(): number {
  return getNum(K.personalBest, 0);
}

/** Returns true if this is a new record */
export function submitPersonalBest(score: number): boolean {
  if (score > getPersonalBest()) {
    setNum(K.personalBest, score);
    return true;
  }
  return false;
}

// ── Active Vehicle ────────────────────────────────────────────────────────────

export function getActiveVehicleId(): string {
  return localStorage.getItem(K.activeVehicle) ?? 't1';
}

export function setActiveVehicleId(id: string) {
  localStorage.setItem(K.activeVehicle, id);
}

// ── Selected Start Level ──────────────────────────────────────────────────────

export function getSelectedStartLevel(): number {
  const raw = getNum(K.selectedStartLevel, 1);
  return Math.min(100, Math.max(1, raw));
}

export function setSelectedStartLevel(level: number) {
  const clamped = Math.min(100, Math.max(1, Math.floor(level)));
  setNum(K.selectedStartLevel, clamped);
}

export function getUserSelectedStartLevel(): number {
  const raw = getNum(K.userSelectedStartLevel, 1);
  return Math.min(100, Math.max(1, raw));
}

export function setUserSelectedStartLevel(level: number) {
  const clamped = Math.min(100, Math.max(1, Math.floor(level)));
  setNum(K.userSelectedStartLevel, clamped);
}

export function getUserUnlockedLevel(): number {
  const raw = getNum(K.userUnlockedLevel, 1);
  return Math.min(100, Math.max(1, raw));
}

export function updateUserUnlockedLevel(level: number) {
  const clamped = Math.min(100, Math.max(1, Math.floor(level)));
  setNum(K.userUnlockedLevel, Math.max(getUserUnlockedLevel(), clamped));
}

export function getAdminMode(): boolean {
  return getBool(K.adminMode);
}

export function setAdminMode(value: boolean) {
  setBool(K.adminMode, value);
}

export function isTutorialCompleted(): boolean {
  return getBool(K.tutorialCompleted);
}

export function setTutorialCompleted(value: boolean) {
  setBool(K.tutorialCompleted, value);
}

export function getStartLevelForMode(): number {
  if (getAdminMode()) {
    return getSelectedStartLevel();
  }
  const unlocked = getUserUnlockedLevel();
  const selected = getUserSelectedStartLevel();
  const tutorialDone = isTutorialCompleted();

  if (!tutorialDone) return 1;

  // If tutorial done, we should be at least at level 2
  // We prefer the user's last selection if valid, otherwise the highest unlocked
  if (selected > 1 && selected <= unlocked) {
    return selected;
  }
  return unlocked;
}

// ── Vehicle Ownership ─────────────────────────────────────────────────────────

export function isVehicleOwned(id: string): boolean {
  if (id === 't1') return true; // T1 always owned
  return getBool(K.vehicleOwned(id));
}

export function buyVehicle(id: string): boolean {
  setBool(K.vehicleOwned(id), true);
  return true;
}

// ── Vehicle Upgrades ──────────────────────────────────────────────────────────

export function isStoOwned(vehicleId: string, level: 1 | 2 | 3 | 4 | 5): boolean {
  return getBool(K.vehicleSto(vehicleId, level));
}

export function buySto(vehicleId: string, level: 1 | 2 | 3 | 4 | 5) {
  setBool(K.vehicleSto(vehicleId, level), true);
}

export function isRodOwned(vehicleId: string, level: 1 | 2 | 3 | 4 | 5): boolean {
  return getBool(K.vehicleRod(vehicleId, level));
}

export function buyRod(vehicleId: string, level: 1 | 2 | 3 | 4 | 5) {
  setBool(K.vehicleRod(vehicleId, level), true);
}

/** Get all STO owned flags for a vehicle as boolean[5] */
export function getStoFlags(vehicleId: string): boolean[] {
  return [1, 2, 3, 4, 5].map(n => isStoOwned(vehicleId, n as 1 | 2 | 3 | 4 | 5));
}

/** Get all ROD owned flags for a vehicle as boolean[5] */
export function getRodFlags(vehicleId: string): boolean[] {
  return [1, 2, 3, 4, 5].map(n => isRodOwned(vehicleId, n as 1 | 2 | 3 | 4 | 5));
}

export function resetProfile(vehicleIds: string[]) {
  // Clear specific known keys
  localStorage.removeItem(K.permanentCoins);
  localStorage.removeItem(K.maxLevelReached);
  localStorage.removeItem(K.personalBest);
  localStorage.removeItem(K.activeVehicle);
  localStorage.removeItem(K.selectedStartLevel);
  localStorage.removeItem(K.userSelectedStartLevel);
  localStorage.removeItem(K.userUnlockedLevel);
  localStorage.removeItem(K.adminMode);

  // Clear boosters and tutorials
  localStorage.removeItem('global_boosters'); // Legacy
  localStorage.removeItem('fj_global_boosters');
  localStorage.removeItem('market_tutorial_v10'); // Legacy Market tutorial
  localStorage.removeItem('fj_market_tutorial');
  localStorage.removeItem(K.rodTutorial);
  localStorage.removeItem(K.storageTutorial);
  localStorage.removeItem(K.boatTutorial);
  localStorage.removeItem(TUTORIAL_CAUGHT_KEY);   // 'fj_tutorial_caught'

  // Clear vehicle-specific upgrades
  vehicleIds.forEach(id => {
    localStorage.removeItem(K.vehicleOwned(id));
    [1, 2, 3, 4, 5].forEach(n => {
      localStorage.removeItem(K.vehicleSto(id, n as 1 | 2 | 3 | 4 | 5));
      localStorage.removeItem(K.vehicleRod(id, n as 1 | 2 | 3 | 4 | 5));
    });
  });

  // Future-proof: Clear any key starting with 'fj_'
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('fj_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

// ── Score Calculation ─────────────────────────────────────────────────────────

export interface RunScoreBreakdown {
  baseScore: number;    // totalSessionCoinsEarned
  depthBonus: number;   // maxLevelReached × 50
  kingBonus: number;    // kingFishCaught × 500
  finalScore: number;
  isNewRecord: boolean;
}

export function calculateRunScore(
  totalCoinsEarned: number,
  maxLevelReached: number,
  kingFishCaught: number
): RunScoreBreakdown {
  const baseScore = totalCoinsEarned;
  const depthBonus = maxLevelReached * 50;
  const kingBonus = kingFishCaught * 500;
  const finalScore = baseScore + depthBonus + kingBonus;
  const isNewRecord = submitPersonalBest(finalScore);
  return { baseScore, depthBonus, kingBonus, finalScore, isNewRecord };
}
