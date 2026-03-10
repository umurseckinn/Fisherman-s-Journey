import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home as HomeIcon, ArrowLeft, Play } from "lucide-react";
import { LEVEL_CONFIG } from "@/game/GameEngine";
import { LEVEL_NAMES } from "@/game/levelNames";
import { getAdminMode, getSelectedStartLevel, getUserSelectedStartLevel, getUserUnlockedLevel, setSelectedStartLevel, setUserSelectedStartLevel } from "@/game/storage";

const parseHex = (value: string) => {
  const raw = value.replace("#", "");
  const hex = raw.length === 3 ? raw.split("").map(c => c + c).join("") : raw.length === 8 ? raw.slice(0, 6) : raw;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
};

const mix = (a: string, b: string, t: number) => {
  const c1 = parseHex(a);
  const c2 = parseHex(b);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b2 = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b2})`;
};

const brighten = (color: string, amount: number) => {
  const c = parseHex(color);
  const r = Math.min(255, Math.round(c.r + (255 - c.r) * amount));
  const g = Math.min(255, Math.round(c.g + (255 - c.g) * amount));
  const b = Math.min(255, Math.round(c.b + (255 - c.b) * amount));
  return `rgb(${r}, ${g}, ${b})`;
};

export default function LevelSelect() {
  const [, setLocation] = useLocation();
  const isAdminMode = getAdminMode();
  const selectedFromHome = getSelectedStartLevel();
  const userUnlockedLevel = getUserUnlockedLevel();
  const userSelectedLevel = getUserSelectedStartLevel();
  const unlockStart = 1;
  const unlockEnd = isAdminMode ? 100 : userUnlockedLevel;
  const defaultSelected = Math.min(isAdminMode ? selectedFromHome : userSelectedLevel, unlockEnd);
  const [selectedLevel, setSelectedLevel] = useState(defaultSelected);

  const levels = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), []);

  const startLevel = () => {
    if (isAdminMode) {
      setSelectedStartLevel(selectedLevel);
    } else {
      setUserSelectedStartLevel(selectedLevel);
    }
    setLocation("/game");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white/95 rounded-[28px] shadow-2xl border-4 border-white p-5">
        <div className="flex items-center justify-between mb-4">
          <Link href="/garage">
            <button className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-800">Select Level</div>
            <div className="text-xs text-slate-500">{isAdminMode ? "Admin mode selection" : "User mode unlocked levels"}</div>
          </div>
          <Link href="/">
            <button className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <HomeIcon className="w-4 h-4" />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {levels.map(level => {
            const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG];
            const sky = config?.skyColor ?? "#87CEEB";
            const sea = config?.seaColor ?? "#29B6F6";
            const mid = mix(sky, sea, 0.5);
            const isCheckpoint = level % 5 === 0;
            const isUnlocked = level >= unlockStart && level <= unlockEnd;
            const isSelected = selectedLevel === level;
            const vibrantSky = brighten(sky, 0.12);
            const vibrantSea = brighten(sea, 0.18);
            const gradient = `linear-gradient(155deg, ${vibrantSky} 0%, ${mid} 50%, ${vibrantSea} 100%)`;
            const glow = `0 10px 24px ${brighten(sea, 0.28)}`;

            return (
              <button
                key={level}
                onClick={() => isUnlocked && setSelectedLevel(level)}
                className={`relative rounded-xl px-2 py-3 text-left transition-all border ${isUnlocked ? "border-white/50" : "border-slate-200"} ${isSelected ? "ring-2 ring-yellow-400 border-yellow-300 scale-[1.02]" : ""} ${isUnlocked ? "shadow-[0_8px_18px_rgba(15,23,42,0.25)]" : "opacity-70"}`}
                style={{ backgroundImage: gradient, backgroundColor: vibrantSea, boxShadow: isUnlocked ? glow : undefined }}
              >
                <div className="relative z-10">
                  <div className="inline-flex items-center rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-yellow-200">
                    L{level}
                  </div>
                  <div className="mt-1 rounded-md bg-black/45 px-1.5 py-1 text-[9px] font-semibold text-yellow-200 leading-tight">
                    {LEVEL_NAMES[level] ?? `Level ${level}`}
                  </div>
                  {isCheckpoint && (
                    <div className="mt-1 inline-flex rounded-md bg-yellow-300/90 px-1.5 py-0.5 text-[8px] font-bold text-slate-900">
                      CHECKPOINT
                    </div>
                  )}
                </div>
                {!isUnlocked && (
                  <>
                    <div className="absolute inset-0 rounded-xl bg-black/25" />
                    <div className="absolute top-1 right-1 text-xs z-10">🔒</div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={startLevel}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          Start Level {selectedLevel}
        </button>
      </div>
    </div>
  );
}
