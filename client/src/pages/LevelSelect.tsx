import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Home as HomeIcon, ArrowLeft, Play, Lock, Crown, Star, Gift, Anchor } from "lucide-react";
import { LEVEL_CONFIG } from "@/game/GameEngine";
import { LEVEL_NAMES } from "@/game/levelNames";
import { BACKGROUND_THEMES, type BackgroundTheme } from "@/game/DynamicBackgroundManager";
import { getAdminMode, getSelectedStartLevel, getUserSelectedStartLevel, getUserUnlockedLevel, setSelectedStartLevel, setUserSelectedStartLevel, isTutorialCompleted, getStartLevelForMode, getMaxLevelReached } from "@/game/storage";

// --- Helper for color interpolation ---
const parseHex = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const interpolateColor = (color1: string, color2: string, t: number) => {
  const c1 = parseHex(color1);
  const c2 = parseHex(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

const getInterpolatedColors = (levelId: number) => {
  const progress = (levelId - 1) / 100;
  const totalThemes = BACKGROUND_THEMES.length;
  const scaledProgress = progress * (totalThemes - 1);
  const index1 = Math.floor(scaledProgress);
  const index2 = Math.min(totalThemes - 1, index1 + 1);
  const t = scaledProgress - index1;

  const theme1 = BACKGROUND_THEMES[index1];
  const theme2 = BACKGROUND_THEMES[index2];

  return {
    skyTop: interpolateColor(theme1.skyTop, theme2.skyTop, t),
    skyBottom: interpolateColor(theme1.skyBottom, theme2.skyBottom, t),
    seaTop: interpolateColor(theme1.seaTop, theme2.seaTop, t),
    seaBottom: interpolateColor(theme1.seaBottom, theme2.seaBottom, t),
  };
};

// --- Dynamic Theme Logic based on Interpolated BACKGROUND_THEMES ---
const getLevelNodeStyle = (levelId: number) => {
  const colors = getInterpolatedColors(levelId);
  const gameLevel = levelId - 1;
  
  // Chunking logic: every 5 levels, slightly darken for depth feel
  const chunkIndex = Math.floor((gameLevel - 1) / 5);
  const darkness = Math.min(chunkIndex * 4, 20); // Subtle 20% max
  
  return {
    // Using 3 points to capture the vibrant "horizon" transition (skyTop -> skyBottom -> seaBottom)
    gradient: `linear-gradient(135deg, ${colors.skyTop} 0%, ${colors.skyBottom} 50%, ${colors.seaBottom} 100%)`,
    colors,
    filter: `brightness(${100 - darkness}%) saturate(${100 + darkness / 4}%)`,
  };
};

// --- Level Node Component (Memoized for performance) ---
const LevelNode = React.memo(({ 
  level, 
  gameLevelNum, 
  isSelected, 
  isSelectable, 
  isPassed, 
  isCheckpoint, 
  isBoss, 
  onClick 
}: {
  level: number;
  gameLevelNum: number;
  isSelected: boolean;
  isSelectable: boolean;
  isPassed: boolean;
  isCheckpoint: boolean;
  isBoss: boolean;
  onClick: () => void;
}) => {
  const nodeStyle = getLevelNodeStyle(level);

  return (
    <button
      onClick={onClick}
      id={`level-node-${level}`}
      className={`
        relative aspect-square rounded-[24px] flex items-center justify-center text-2xl font-display font-black transition-[transform,opacity] duration-300 will-change-transform
        ${!isSelectable 
          ? "opacity-80 grayscale-[0.4] cursor-not-allowed border-2 border-white/5 shadow-inner" 
          : isSelected
            ? "shadow-[0_0_25px_rgba(255,165,0,0.7)] border-b-8 border-orange-700 -translate-y-1 animate-slow-pulse scale-110 z-20"
            : isPassed
              ? "border-b-4 border-black/20 hover:scale-105 active:scale-95 shadow-lg border-2 border-white/10"
              : "border-b-4 border-white/10 hover:scale-105 active:scale-95 border-2 border-white/20"
        }
      `}
    >
      <div 
        className="absolute inset-0 rounded-[22px] overflow-hidden transition-opacity duration-500 will-change-[filter,opacity]"
        style={{ 
          background: nodeStyle.gradient,
          filter: !isSelectable ? `${nodeStyle.filter} blur(4px)` : isSelected ? '' : nodeStyle.filter,
          opacity: !isSelectable ? 0.6 : 1,
          transform: 'translateZ(0)'
        }}
      />

      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {!isSelectable ? (
          <Lock className="w-6 h-6 text-white/90 drop-shadow-md" />
        ) : (
          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-white">
            {gameLevelNum}
          </span>
        )}
      </div>

      {isCheckpoint && (
        <div className={`absolute -top-3 -left-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full px-2.5 py-1.5 shadow-2xl border-2 border-white z-50 flex items-center gap-1 animate-bounce`}>
          <Anchor className="w-3.5 h-3.5 text-white fill-white drop-shadow-sm" />
          <span className="text-[10px] font-display font-black text-white leading-none tracking-tight drop-shadow-md">CHECKPOINT</span>
        </div>
      )}

      {isBoss && isSelectable && (
        <div className={`absolute -top-2 -right-2 rounded-full p-1.5 shadow-xl border-2 border-white z-50 animate-bounce bg-yellow-400`}>
          <Crown className="w-3.5 h-3.5 text-orange-700 fill-orange-700" />
        </div>
      )}
      
      {isSelected && isSelectable && (
        <div className="absolute -inset-2 border-4 border-yellow-300 rounded-[30px] animate-[ping_6s_infinite] opacity-30 z-40" />
      )}
    </button>
  );
});

export default function LevelSelect() {
  const [, setLocation] = useLocation();
  const isAdminMode = getAdminMode();
  
  const maxInternalLevelReached = getMaxLevelReached(); 
  const maxGameLevelPassed = Math.max(0, maxInternalLevelReached - 1);
  const lastCheckpointPassed = Math.floor(maxGameLevelPassed / 5) * 5;
  const highestSelectableGameLevel = lastCheckpointPassed + 1;
  const highestSelectableInternalId = highestSelectableGameLevel + 1;

  const initialLevel = isAdminMode ? getStartLevelForMode() : highestSelectableInternalId;
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected level on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const selectedElement = document.getElementById(`level-node-${selectedLevel}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const levels = useMemo(() => {
    return Array.from({ length: 99 }, (_, i) => i + 2);
  }, []);

  const selectedLevelStyle = useMemo(() => getLevelNodeStyle(selectedLevel), [selectedLevel]);

  const startLevel = () => {
    if (isAdminMode) {
      setSelectedStartLevel(selectedLevel);
    } else {
      setUserSelectedStartLevel(selectedLevel);
    }
    setLocation("/game");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 pt-safe pb-safe overflow-hidden font-sans">
      {/* 1. Oceanic Gradient Background - Dynamic based on Selected Level */}
      <div 
        className="absolute inset-0 transition-all duration-1000 opacity-90 pointer-events-none" 
        style={{ 
          background: `linear-gradient(to bottom, ${getInterpolatedColors(selectedLevel).skyTop}, ${getInterpolatedColors(selectedLevel).skyBottom}, ${getInterpolatedColors(selectedLevel).seaTop}, ${getInterpolatedColors(selectedLevel).seaBottom})` 
        }} 
      />
      
      {/* Bubbles Decoration - Optimized for mobile performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white/5 animate-gentle-float"
            style={{
              width: Math.random() * 40 + 10 + 'px',
              height: Math.random() * 40 + 10 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}
      </div>

      {/* 2. Glassmorphism Container - Optimized backdrop-blur for mobile */}
      <div className="relative w-full max-w-md h-[90vh] bg-white/10 backdrop-blur-md rounded-[40px] shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] border-4 border-white/30 flex flex-col overflow-hidden animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <Link href="/garage">
              <button className="p-3 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-all border-2 border-white/20 active:scale-90 shadow-lg">
                <ArrowLeft className="w-6 h-6 stroke-[3px]" />
              </button>
            </Link>
            <div className="flex flex-col">
              <h2 className="text-2xl font-display font-black text-white text-shadow-lg tracking-tight uppercase">Island Select</h2>
              <div className="text-cyan-100 text-[10px] font-bold tracking-widest uppercase opacity-80">
                {isAdminMode ? "🗺️ EXPLORER MODE" : `🏝️ ${maxGameLevelPassed} PASSED`}
              </div>
            </div>
          </div>
          <Link href="/">
            <button className="p-3 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-all border-2 border-white/20 active:scale-90 shadow-lg">
              <HomeIcon className="w-6 h-6 stroke-[3px]" />
            </button>
          </Link>
        </div>

        {/* 3. Level Grid (Bubbles/Squircles) */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar relative z-10"
        >
          <div className="grid grid-cols-4 gap-4 pb-8">
            {levels.map(level => {
              const gameLevelNum = level - 1;
              return (
                <LevelNode
                  key={level}
                  level={level}
                  gameLevelNum={gameLevelNum}
                  isSelected={selectedLevel === level}
                  isSelectable={isAdminMode || gameLevelNum <= highestSelectableGameLevel}
                  isPassed={!isAdminMode && gameLevelNum <= maxGameLevelPassed}
                  isCheckpoint={gameLevelNum % 5 === 0}
                  isBoss={gameLevelNum % 10 === 0}
                  onClick={() => {
                    const isSelectable = isAdminMode || gameLevelNum <= highestSelectableGameLevel;
                    if (isSelectable) setSelectedLevel(level);
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* 4. Dynamic Info Panel & Juicy Start Button */}
        <div className="px-6 py-4 bg-black/20 backdrop-blur-md border-t-2 border-white/10 relative z-20">
          <div className="flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border-2 border-white/20 shadow-inner">
               {(() => {
                  const gameNum = selectedLevel - 1;
                  if (gameNum % 10 === 0) return <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-glow" />;
                  if (gameNum % 5 === 0) return <Gift className="w-8 h-8 text-cyan-300" />;
                  return <Star className="w-8 h-8 text-white fill-white/20" />;
               })()}
            </div>
            <div className="flex flex-col">
              <div className="text-white font-display font-black text-xl tracking-tight leading-none mb-1 uppercase">
                Level {selectedLevel - 1}
              </div>
              <div className="text-cyan-200 text-sm font-bold opacity-90 italic truncate max-w-[200px]">
                "{LEVEL_NAMES[selectedLevel] || "Unknown Waters"}"
              </div>
            </div>
          </div>

          <button
            onClick={startLevel}
            className="mt-6 w-full group relative active:scale-95 transition-transform"
          >
            {/* Dynamic Shadow based on Selected Level's Sea Color */}
            <div 
              className="absolute inset-0 rounded-[24px] translate-y-2 group-active:translate-y-1 transition-all" 
              style={{ backgroundColor: selectedLevelStyle.colors.seaBottom, filter: 'brightness(0.6)' }}
            />
            {/* Main Button Body - Dynamic Gradient */}
            <div 
              className="relative rounded-[24px] py-5 px-8 flex items-center justify-center gap-3 border-t-4 shadow-xl group-active:translate-y-1 transition-all overflow-hidden"
              style={{ 
                background: `linear-gradient(to bottom, ${selectedLevelStyle.colors.skyTop} 0%, ${selectedLevelStyle.colors.skyBottom} 50%, ${selectedLevelStyle.colors.seaBottom} 100%)`,
                borderColor: selectedLevelStyle.colors.skyTop,
                opacity: 0.95
              }}
            >
              {/* Glow Effect */}
              <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-30deg] animate-[shimmer_3s_infinite]" />
              
              <Play className="w-7 h-7 text-white fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="text-2xl font-display font-black text-white tracking-wide uppercase drop-shadow-[0_3px_1px_rgba(0,0,0,0.4)]">
                Set Sail!
              </span>
            </div>
          </button>
        </div>
      </div>

      <style>{`
         @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-gentle-float {
          animation: float 15s linear infinite;
        }
        @keyframes float {
          0% { transform: translateY(0) translateZ(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateZ(0); opacity: 0; }
        }
        .animate-slow-pulse {
          animation: slow-pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes slow-pulse {
          0%, 100% { transform: scale(1.1) translateY(-4px) translateZ(0); }
          50% { transform: scale(1.06) translateY(-4px) translateZ(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
           width: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-track {
           background: rgba(255, 255, 255, 0.05);
         }
         .custom-scrollbar::-webkit-scrollbar-thumb {
           background: rgba(255, 255, 255, 0.2);
           border-radius: 10px;
         }
       `}</style>
    </div>
  );
}
