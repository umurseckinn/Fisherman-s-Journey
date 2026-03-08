import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Clock, Fuel, Anchor, Pause, RotateCcw, Home as HomeIcon, Play, Bomb, X } from "lucide-react";
import { GameEngine, CANVAS_WIDTH, CANVAS_HEIGHT, SEA_LEVEL_Y, LEVEL_CONFIG } from "@/game/GameEngine";
import { VEHICLES, getEffectiveStats } from "@/game/vehicles";
import { getActiveVehicleId, getStoFlags, getRodFlags, submitPersonalBest, type RunScoreBreakdown } from "@/game/storage";
import { type GameState, type Entity, type CurseType, type InventoryItem, type FishClass } from "@/game/types";
import { GameOverModal } from "@/components/GameOverModal";
import { InfoCard } from "@/components/InfoCard";
import { BoosterPurchaseModal, type BoosterType } from "@/components/BoosterPurchaseModal";
import { InsufficientFuelModal } from "@/components/InsufficientFuelModal";
import { GoldDoubloonShopModal } from "@/components/GoldDoubloonShopModal";
import { getPermanentCoins, setPermanentCoins } from "@/game/storage";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const whirlpoolImgRef = useRef<HTMLImageElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<"playing" | "gameover" | "shop" | "win">("playing");

  const [score, setScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<RunScoreBreakdown | null>(null);
  const runStats = useRef({ totalCoins: 0, kingFishCount: 0, maxLevel: 1 });
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [anchorEffectTimer, setAnchorEffectTimer] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [fuelCost, setFuelCost] = useState<number>(50);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [currentStorage, setCurrentStorage] = useState(0);
  const [buoyancyOffset, setBuoyancyOffset] = useState(0);
  const [weightDisplayOffset, setWeightDisplayOffset] = useState(0);
  const activeVehicleId = getActiveVehicleId();
  const activeVehicle = VEHICLES.find(vehicle => vehicle.id === activeVehicleId) ?? VEHICLES[0];
  const ownedSto = getStoFlags(activeVehicle.id);
  const ownedRod = getRodFlags(activeVehicle.id);
  const effectiveStats = getEffectiveStats(activeVehicle, ownedSto.map(Number), ownedRod.map(Number));
  const derivedRodLevel = Math.max(1, ownedRod.filter(Boolean).length + 1);
  const derivedBoatLevel = Math.max(1, ownedSto.filter(Boolean).length + 1);

  const [hookAttempts, setHookAttempts] = useState(effectiveStats.castAttempts);
  const [maxHookAttempts, setMaxHookAttempts] = useState(effectiveStats.castAttempts);
  const [activeCurse, setActiveCurse] = useState<CurseType>('none');
  const [curseTimerMs, setCurseTimerMs] = useState(0);
  const [caughtFish, setCaughtFish] = useState<Entity | null>(null);
  const [selectedEntityForInfo, setSelectedEntityForInfo] = useState<FishClass | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseBoosterType, setPurchaseBoosterType] = useState<BoosterType | null>(null);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showDoubloonShop, setShowDoubloonShop] = useState(false);

  const [upgrades, setUpgrades] = useState({
    rodLevel: derivedRodLevel,
    boatLevel: derivedBoatLevel,
    hasFuel: false,
    storageCapacity: effectiveStats.storage,
    swingSpeed: effectiveStats.swingSpeed,
    castSpeed: effectiveStats.castSpeed,
    returnSpeed: effectiveStats.returnSpeed,
    hookDepth: effectiveStats.hookDepth,
    castAttempts: effectiveStats.castAttempts,
    coralProtection: effectiveStats.coralProtection,
    kelpDuration: effectiveStats.kelpDuration,
  });
  const [activeBoosters, setActiveBoosters] = useState(() => {
    const saved = localStorage.getItem('global_boosters');
    if (saved) {
      const boosters = JSON.parse(saved);
      return {
        ...boosters,
        harpoon: Math.max(0, Math.floor(boosters.harpoon || 0)),
        net: Math.max(0, Math.floor(boosters.net || 0)),
        tnt: Math.max(0, Math.floor(boosters.tnt || 0)),
        anchor: Math.max(0, Math.floor(boosters.anchor || 0))
      };
    }
    return {
      speed: false,
      value: false,
      lucky: false,
      harpoon: 0,
      net: 0,
      tnt: 0,
      anchor: 0
    };
  });
  const [selectedBooster, setSelectedBooster] = useState<'harpoon' | 'net' | 'tnt' | 'anchor' | null>(null);

  useEffect(() => {
    localStorage.setItem('global_boosters', JSON.stringify(activeBoosters));
  }, [activeBoosters]);

  useEffect(() => {
    if (!canvasRef.current || !bgCanvasRef.current || gameState !== "playing") return;

    const ctx = canvasRef.current.getContext("2d");
    const bgCtx = bgCanvasRef.current.getContext("2d");
    if (!ctx || !bgCtx) return;

    const levelConfig = LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG];
    const initialState: GameState = {
      score,
      level: currentLevel,
      region: levelConfig?.region ?? 1,
      fuelCost: levelConfig?.fuelCost ?? 50,
      timeRemaining: levelConfig?.duration ?? 60,
      isPlaying: true,
      weather: "sunny",
      hook: {
        angle: Math.PI / 2,
        length: 0,
        state: 'idle',
        direction: 1,
        x: CANVAS_WIDTH / 2,
        y: SEA_LEVEL_Y,
        caughtEntity: null,
      },
      fishes: [],
      inventory,
      upgrades,
      currentStorage,
      hookAttempts: currentLevel === 1 ? 3 : hookAttempts,
      maxHookAttempts: currentLevel === 1 ? 3 : maxHookAttempts,
      hookSpeedBoostMs: 0,
      fishPanicMs: 0,
      buoyancyOffset: 0,
      buoyancyOffsetMs: 0,
      weightDisplayOffset: 0,
      weightDisplayOffsetMs: 0,
      anchorSnagMs: 0,
      hookBrokenMs: 0,
      valueMultiplier: 1,
      leafBonusStacks: 0,
      candyBonusStacks: 0,
      zapShockMs: 0,
      moonSlowMs: 0,
      lavaBurnMs: 0,
      activeCurse: 'none',
      curseTimerMs: 0,
      boosters: activeBoosters,
      activeBooster: selectedBooster,
      anchorEffectTimerMs: 0,
      isPaused: false
    };

    const engine = new GameEngine(ctx, bgCtx, whirlpoolImgRef.current, initialState, {
      onGameOver: (finalScore, finalLevel, reason) => {
        setGameState("gameover");
        setGameOverReason(reason ?? null);

        const baseScore = runStats.current.totalCoins;
        const depthBonus = Math.max(runStats.current.maxLevel, finalLevel) * 50;
        const kingBonus = runStats.current.kingFishCount * 500;
        const totalFinalScore = baseScore + depthBonus + kingBonus;

        const isNewRecord = submitPersonalBest(totalFinalScore);

        setScoreBreakdown({
          baseScore,
          depthBonus,
          kingBonus,
          finalScore: totalFinalScore,
          isNewRecord
        });
      },
      onScoreUpdate: (newScore) => setScore(newScore),
      onEarning: (amount) => {
        runStats.current.totalCoins += amount;
      },
      onLevelComplete: (level) => {
        runStats.current.maxLevel = Math.max(runStats.current.maxLevel, level);
        const state = engineRef.current?.getState();
        if (state) {
          setTimeLeft(Math.ceil(state.timeRemaining));
          setInventory([...state.inventory]);
          setScore(state.score);
          setCurrentStorage(state.currentStorage ?? state.inventory.reduce((sum, item) => sum + item.weight, 0));
          setHookAttempts(state.hookAttempts || 0);
          setMaxHookAttempts(state.maxHookAttempts || 0);
          setFuelCost(state.fuelCost || 50);

          if (state.upgrades) {
            setUpgrades(prev => ({
              ...prev,
              rodLevel: state.upgrades.rodLevel,
              boatLevel: state.upgrades.boatLevel,
              hasFuel: state.upgrades.hasFuel,
              storageCapacity: state.upgrades.storageCapacity,
              swingSpeed: state.upgrades.swingSpeed,
              castSpeed: state.upgrades.castSpeed,
              returnSpeed: state.upgrades.returnSpeed,
              hookDepth: state.upgrades.hookDepth,
              castAttempts: state.upgrades.castAttempts,
              coralProtection: state.upgrades.coralProtection,
              kelpDuration: state.upgrades.kelpDuration,
            }));
          }
        }
        setCurrentLevel(level);
        if (state) {
          // Keep the existing boosters instead of resetting them
          setActiveBoosters((prev: any) => ({ ...prev, speed: true }));
        }
        setSelectedBooster(null);

        if (level >= 100) {
          setGameState("win");
          confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
          return;
        }
        setGameState("shop");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      },
      onFishCaught: (fish) => {
        setCaughtFish(fish);
        setTimeout(() => setCaughtFish(null), 2000);
        if (fish.type === 'king') {
          runStats.current.kingFishCount++;
        }
      },
      onBoosterUsed: (type: 'harpoon' | 'net' | 'tnt' | 'anchor') => {
        setActiveBoosters((prev: Record<string, any>) => ({
          ...prev,
          [type]: Math.max(0, Math.floor(prev[type] - 1))
        }));
        setSelectedBooster(null);
      }
    });

    engine.start();
    engineRef.current = engine;

    const uiSync = setInterval(() => {
      const state = engineRef.current?.getState();
      if (state) {
        setTimeLeft(Math.ceil(state.timeRemaining));
        setInventory([...state.inventory]);
        setScore(state.score);
        setCurrentStorage(state.currentStorage ?? state.inventory.reduce((sum, item) => sum + item.weight, 0));
        setBuoyancyOffset(state.buoyancyOffset || 0);
        setWeightDisplayOffset(state.weightDisplayOffset || 0);
        setAnchorEffectTimer(state.anchorEffectTimerMs || 0);
        setHookAttempts(state.hookAttempts || 0);
        setMaxHookAttempts(state.maxHookAttempts || 0);
        setActiveCurse(state.activeCurse || 'none');
        setCurseTimerMs(state.curseTimerMs || 0);
        setIsPaused(state.isPaused || false);

        if (state.upgrades) {
          setUpgrades(prev => ({
            ...prev,
            rodLevel: state.upgrades.rodLevel,
            boatLevel: state.upgrades.boatLevel,
            hasFuel: state.upgrades.hasFuel,
            storageCapacity: state.upgrades.storageCapacity,
            swingSpeed: state.upgrades.swingSpeed,
            castSpeed: state.upgrades.castSpeed,
            returnSpeed: state.upgrades.returnSpeed,
            hookDepth: state.upgrades.hookDepth,
            castAttempts: state.upgrades.castAttempts,
            coralProtection: state.upgrades.coralProtection,
            kelpDuration: state.upgrades.kelpDuration,
          }));
        }
      }
    }, 200);

    return () => {
      engine.stop();
      clearInterval(uiSync);
    };
  }, [gameState, currentLevel]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.getState().activeBooster = selectedBooster;
    }
  }, [selectedBooster]);

  const handlePurchase = (pkg: { type: 'all' | 'single', amount: number }) => {
    if (!purchaseBoosterType) return;

    setActiveBoosters((prev: any) => {
      const next = { ...prev };
      if (pkg.type === 'all') {
        next.harpoon = Math.max(0, Math.floor((next.harpoon || 0) + pkg.amount));
        next.net = Math.max(0, Math.floor((next.net || 0) + pkg.amount));
        next.tnt = Math.max(0, Math.floor((next.tnt || 0) + pkg.amount));
        next.anchor = Math.max(0, Math.floor((next.anchor || 0) + pkg.amount));
      } else if (purchaseBoosterType) {
        next[purchaseBoosterType] = Math.max(0, Math.floor((next[purchaseBoosterType] || 0) + pkg.amount));
      }
      localStorage.setItem('global_boosters', JSON.stringify(next));
      if (engineRef.current) {
        engineRef.current.getState().boosters = { ...next };
      }

      return next;
    });
  };

  const handleSellAll = () => {
    const isTersMarket = activeCurse === 'ters_market' || activeCurse === 'final_3';
    const totalValue = inventory.reduce((sum, item) => {
      const value = isTersMarket ? Math.round(item.value * 0.5) : item.value;
      return sum + value;
    }, 0);

    setInventory([]);
    setCurrentStorage(0);
    setBuoyancyOffset(0);
    setWeightDisplayOffset(0);

    if (engineRef.current) {
      const engineState = engineRef.current.getState();
      engineState.inventory = [];
      engineState.buoyancyOffset = 0;
      engineState.weightDisplayOffset = 0;
      engineRef.current.earnCoins(totalValue);
      engineRef.current.recalculateStorage();
    }
  };

  const buyFuel = () => {
    if (upgrades.hasFuel) return;
    if (score < fuelCost) {
      setShowFuelModal(true);
      return;
    }

    setScore(prev => prev - fuelCost);
    setUpgrades(prev => ({ ...prev, hasFuel: true }));

    if (engineRef.current) {
      engineRef.current.getState().score -= fuelCost;
      engineRef.current.getState().upgrades.hasFuel = true;
    }
  };

  const REPAIR_COST = 60;

  const repairHook = (amount: number) => {
    if (hookAttempts >= maxHookAttempts) return;
    if (score < REPAIR_COST) return; // Yetersiz bakiye kontrolü

    const newAttempts = Math.min(maxHookAttempts, hookAttempts + amount);
    setScore(prev => prev - REPAIR_COST);
    setHookAttempts(newAttempts);

    if (engineRef.current) {
      engineRef.current.getState().score -= REPAIR_COST;
      engineRef.current.getState().hookAttempts = newAttempts;
    }
  };

  const handleWatchAdForFuel = () => {
    if (upgrades.hasFuel) return;
    setUpgrades(prev => ({ ...prev, hasFuel: true }));
    if (engineRef.current) {
      engineRef.current.getState().upgrades.hasFuel = true;
    }
  };

  const handleNextLevel = () => {
    if (!upgrades.hasFuel) return;

    if (currentLevel >= 100) return;
    setCurrentLevel(prev => {
      const nextLevel = prev + 1;
      const config = LEVEL_CONFIG[nextLevel as keyof typeof LEVEL_CONFIG];
      setFuelCost(config?.fuelCost ?? 50);
      return nextLevel;
    });
    setUpgrades(prev => ({ ...prev, hasFuel: false }));
    setGameState("playing");
  };

  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const baseWeight = currentStorage || 0;
  const isTersAgirlik = activeCurse === 'ters_agirlik' || activeCurse === 'final_3';
  const kingDisplayOffset = activeVehicleId === 't7' && inventory.some(item => item.type === 'king') ? -5 : 0;
  const displayWeight = Math.max(0, baseWeight + weightDisplayOffset + kingDisplayOffset);

  // 'ters_agirlik' curse: gauge turns reverse (%0=full, %100=empty)
  const rawStorageRatio = (displayWeight / upgrades.storageCapacity) || 0;
  const storageRatio = isTersAgirlik ? (1 - rawStorageRatio) : rawStorageRatio;
  const storagePercent = Math.min(100, storageRatio * 100);

  const storageColor = rawStorageRatio >= 0.96 ? 'bg-red-500' :
    rawStorageRatio >= 0.81 ? 'bg-orange-500' :
      rawStorageRatio >= 0.61 ? 'bg-yellow-400' : 'bg-green-500';

  const resolveInventoryImage = (type: FishClass) => {
    const envMap: Record<string, string> = {
      coral: 'coral.png',
      sea_kelp: 'sea_kelp.png',
      sea_kelp_horizontal: 'sea_kelp.png',
      sea_rock: 'sea_rock.png',
      sea_rock_large: 'sea_rock.png',
      gold_doubloon: 'gold_doubloon.png',
      whirlpool: 'whirlpool.png',
      sunken_boat: 'sunken_boat.png',
      shark_skeleton: 'shark_skeleton.png',
      anchor: 'anchor.png',
      shell: 'shell.png',
    };
    if (envMap[type]) return `/assets/environment/${envMap[type]}`;
    return `/assets/fish/${type}_fish.png`;
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    const existing = acc.find(i => i.type === item.type);
    if (existing) {
      existing.count++;
      (existing as any).totalValue += item.value;
    } else {
      acc.push({ ...item, count: 1, totalValue: item.value } as any);
    }
    return acc;
  }, [] as (InventoryItem & { count: number, totalValue: number })[]);

  const togglePause = () => {
    if (engineRef.current) {
      if (isPaused) {
        engineRef.current.resume();
      } else {
        engineRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const handleEntityInfoOpen = (type: FishClass) => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPaused(true);
    }
    setSelectedEntityForInfo(type);
  };

  return (
    <div className="relative w-full h-screen bg-slate-900 flex items-center justify-center overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
      <div className="relative w-full h-full max-w-[450px] max-h-[800px] bg-sky-100 shadow-2xl overflow-hidden md:rounded-[32px] md:border-8 md:border-slate-800">

        {/* Playable Area */}
        {gameState === "playing" && (
          <>
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
              <div className="flex gap-2 items-center pointer-events-auto">
                <div
                  className="bg-white/90 backdrop-blur-sm border-2 border-white rounded-xl px-3 py-1.5 shadow-md flex items-center gap-1 cursor-pointer hover:bg-white transition-colors"
                  onClick={() => setShowDoubloonShop(true)}
                  title="Buy Gold Doubloons"
                >
                  <img src="/assets/environment/gold_doubloon.png" alt="Gold Doubloon" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.8))' }} />
                  <span className="text-xl font-display font-bold text-slate-700">{score}</span>
                </div>
                <div className={`border-2 border-white rounded-2xl px-3 py-1.5 shadow-md flex items-center gap-2 ${anchorEffectTimer > 0 ? 'bg-green-500 animate-pulse' : 'bg-[#99E5FF]'}`}>
                  <Clock className={`w-5 h-5 text-white ${anchorEffectTimer > 0 ? 'fill-green-700' : 'fill-[#FFB347]'}`} />
                  <span className="text-xl font-display font-bold text-white">
                    {anchorEffectTimer > 0
                      ? formatTime(Math.ceil(anchorEffectTimer / 1000))
                      : formatTime(timeLeft)}
                  </span>
                </div>
                <button
                  onClick={togglePause}
                  className="bg-white/90 backdrop-blur-sm border-2 border-white rounded-xl p-2 shadow-md hover:scale-105 transition-transform active:scale-95"
                >
                  <Pause className="w-5 h-5 text-slate-600 fill-slate-600" />
                </button>
              </div>

              <div className="flex flex-col gap-2 items-end">
                {/* Storage Bar */}
                <div className="bg-white/90 backdrop-blur-sm border-2 border-white rounded-xl p-2 shadow-md w-32 flex flex-col gap-1 transition-all">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1"><Anchor className="w-3 h-3" /> Storage</span>
                    <span className={storageRatio >= 0.96 ? 'text-red-500 animate-pulse' : storageRatio >= 0.81 ? 'text-orange-500' : storageRatio >= 0.61 ? 'text-yellow-600' : 'text-slate-500'}>
                      {displayWeight.toFixed(1)} / {upgrades.storageCapacity} kg
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${storageColor}`}
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm border-2 border-white rounded-xl p-2 shadow-md w-32 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Hook</span>
                  <span className={hookAttempts === 0 ? 'text-red-500 animate-pulse' : 'text-slate-600'}>
                    {hookAttempts} / {maxHookAttempts}
                  </span>
                </div>
                {activeCurse !== 'none' && (
                  <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold animate-bounce shadow-lg">
                    CURSE: {activeCurse.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <canvas ref={bgCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0 w-full h-full block" style={{ zIndex: 0 }} />
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
                const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
                engineRef.current?.handlePointerDown(x, y);
              }}
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
                const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
                engineRef.current?.handlePointerMove(x, y);
              }}
              onPointerUp={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
                const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
                engineRef.current?.handlePointerUp(x, y);
              }}
              className="absolute inset-0 w-full h-full block touch-none"
              style={{ zIndex: 1 }}
            />
            <img
              ref={whirlpoolImgRef}
              src="/assets/environment/whirlpool.png"
              alt=""
              style={{
                position: 'absolute',
                display: 'none',
                width: '110px',
                height: '110px',
                transformOrigin: 'center center',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />

            {caughtFish && (
              <div className="absolute left-4 z-50 pointer-events-auto" style={{ top: SEA_LEVEL_Y - 140 }}>
                <button
                  onClick={() => handleEntityInfoOpen(caughtFish.type as FishClass)}
                  className="bg-white/50 backdrop-blur-md p-2 rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.08)] border-2 border-white/50 flex flex-col items-center text-center animate-in zoom-in-50 duration-300 w-[100px] group hover:scale-105 active:scale-95 transition-all"
                >
                  <div className="w-20 h-14 mb-1 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full opacity-25 blur-lg scale-110 group-hover:scale-125 transition-transform animate-pulse"></div>
                    <img
                      src={['coral', 'gold_doubloon', 'whirlpool', 'sunken_boat', 'shark_skeleton', 'env_bubbles', 'anchor', 'shell', 'sea_kelp', 'sea_rock', 'sea_rock_large', 'sea_kelp_horizontal'].includes(caughtFish.type) ? `/assets/environment/${caughtFish.type === 'env_bubbles' ? 'bubbles' : caughtFish.type}.png` : `/assets/fish/${caughtFish.type}_fish.png`}
                      alt={caughtFish.name}
                      className="w-full h-full object-contain drop-shadow-md relative z-10 scale-125"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <h2 className="text-[11px] font-display font-bold text-slate-800 leading-tight mb-1">{caughtFish.name}</h2>
                  <div className="bg-primary/20 text-primary text-[8px] px-2 py-0.5 rounded-full font-bold">INFO</div>
                </button>
              </div>
            )}

            {/* Booster Selection Buttons */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
              {[
                { id: 'harpoon', imageSrc: '/assets/boosters/harpoon.png', label: 'Harpoon', count: activeBoosters.harpoon },
                { id: 'net', imageSrc: '/assets/boosters/net.png', label: 'Net', count: activeBoosters.net },
                { id: 'tnt', imageSrc: '/assets/boosters/tnt.png', label: 'TNT', count: activeBoosters.tnt },
                { id: 'anchor', imageSrc: '/assets/boosters/the_anchor.png', label: 'Anchor', count: activeBoosters.anchor },
              ].map((booster) => (
                <button
                  key={booster.id}
                  onClick={() => {
                    if (booster.count <= 0) {
                      setPurchaseBoosterType(booster.id as BoosterType);
                      setPurchaseModalOpen(true);
                      if (engineRef.current) {
                        engineRef.current.pause();
                        setIsPaused(true);
                      }
                    } else {
                      if (booster.id === 'anchor') {
                        if (engineRef.current) {
                          engineRef.current.activateAnchor();
                        }
                      } else {
                        setSelectedBooster(prev => prev === booster.id ? null : booster.id as any);
                      }
                    }
                  }}
                  className={`relative w-20 h-20 flex items-center justify-center transition-all ${booster.count === 0
                    ? 'opacity-50 grayscale hover:scale-105'
                    : selectedBooster === booster.id
                      ? 'scale-125 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]'
                      : 'hover:scale-110 drop-shadow-md'
                    }`}
                >
                  <img src={booster.imageSrc} alt={booster.label} className="w-24 h-24 max-w-none object-contain scale-125 hover:scale-150 transition-transform origin-center" />
                  <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border border-white">
                    {booster.count}
                  </span>
                  {selectedBooster === booster.id && (
                    <div className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-in zoom-in-50">
                      <X className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Shop UI */}
        {gameState === "shop" && (
          <div className="absolute inset-0 bg-white/95 z-20 p-3 flex flex-col gap-2">
            <div className="text-center relative">
              <Link href="/">
                <button className="absolute left-0 top-0 p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <HomeIcon className="w-5 h-5" />
                </button>
              </Link>
              <h2 className="text-xl font-display font-bold text-blue-600">Level {currentLevel - 1} Complete!</h2>
              <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                <img src="/assets/environment/gold_doubloon.png" alt="" className="w-5 h-5 object-contain" />
                {score}
              </div>
              {activeCurse !== 'none' && (
                <div className="mt-1 text-red-600 font-bold text-[11px] bg-red-50 p-2 rounded-lg border border-red-200">
                  L{currentLevel} CURSE ACTIVE: {activeCurse.toUpperCase()}
                </div>
              )}
            </div>

            <div className="w-full bg-white/70 border border-slate-200 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-slate-700">Sell Fish</div>
                <div className="text-xs text-slate-500">{inventory.length} fish</div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                {groupedInventory.length === 0 ? (
                  <div className="text-xs text-slate-400 italic px-2 py-6">No fish yet</div>
                ) : (
                  groupedInventory.map(item => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-[120px] bg-[#F7FAFF] rounded-[16px] p-3 pt-4 flex flex-col items-center shadow-sm border border-slate-100"
                    >
                      <div className="relative w-[72px] h-[72px] flex items-center justify-center mb-2">
                        <img
                          src={resolveInventoryImage(item.type)}
                          alt={item.name}
                          className="w-[88px] h-[66px] object-contain"
                        />
                        {item.count > 1 && (
                          <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            x{item.count}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 text-center">{item.name}</span>
                      <span className="text-[11px] font-bold text-primary bg-white/60 px-2 py-0.5 rounded-full mt-1 flex items-center gap-0.5">
                        <img src="/assets/environment/gold_doubloon.png" alt="" className="w-3 h-3 object-contain" />{item.totalValue}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <Button onClick={handleSellAll} disabled={inventory.length === 0} className="w-full h-8 text-xs bg-green-500 hover:bg-green-600">Sell All</Button>
            </div>

            <div className="w-full bg-white/70 border border-slate-200 rounded-2xl p-3">
              <div className="text-sm font-bold text-slate-700 mb-2">Buy Fuel</div>
              <Button onClick={buyFuel} disabled={upgrades.hasFuel} variant={upgrades.hasFuel ? "outline" : "default"} className="w-full h-10 bg-red-500 hover:bg-red-600 text-white">
                <div className="flex items-center justify-center gap-2 text-sm font-bold">
                  <Fuel className="w-4 h-4" />
                  <img src="/assets/environment/gold_doubloon.png" alt="" className="w-4 h-4 object-contain" />
                  Buy Fuel ({fuelCost})
                </div>
              </Button>
            </div>



            <div className="w-full bg-white/70 border border-slate-200 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-slate-700">Rod Repair</div>
                <div className="text-xs text-slate-500">{hookAttempts}/{maxHookAttempts}</div>
              </div>
              <Button onClick={() => repairHook(1)} disabled={hookAttempts >= maxHookAttempts} className="w-full h-9 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold">
                <span className="flex items-center gap-1">Repair +1 (<img src="/assets/environment/gold_doubloon.png" alt="" className="w-3.5 h-3.5 object-contain inline" />60)</span>
              </Button>
            </div>

            <div className="w-full bg-white/70 border border-slate-200 rounded-2xl p-3">
              <div className="text-sm font-bold text-slate-700 mb-2">Boosters</div>
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <button
                  onClick={() => { setPurchaseBoosterType('harpoon'); setPurchaseModalOpen(true); }}
                  className="flex-1 flex flex-col items-center bg-white rounded-xl px-2 py-2 shadow-sm border border-slate-100 min-w-[80px] hover:scale-105 transition-all"
                >
                  <img src="/assets/boosters/harpoon.png" alt="Harpoon" className="w-16 h-16 object-contain scale-125" />
                  <span className="text-[10px] font-extrabold text-slate-700 bg-white/70 px-2 py-0.5 rounded-full">Harpoon</span>
                  <span className="text-sm font-black text-yellow-600 leading-tight">{activeBoosters.harpoon}</span>
                </button>
                <button
                  onClick={() => { setPurchaseBoosterType('net'); setPurchaseModalOpen(true); }}
                  className="flex-1 flex flex-col items-center bg-white rounded-xl px-2 py-2 shadow-sm border border-slate-100 min-w-[80px] hover:scale-105 transition-all"
                >
                  <img src="/assets/boosters/net.png" alt="Net" className="w-16 h-16 object-contain scale-125" />
                  <span className="text-[10px] font-extrabold text-slate-700 bg-white/70 px-2 py-0.5 rounded-full">Net</span>
                  <span className="text-sm font-black text-blue-600 leading-tight">{activeBoosters.net}</span>
                </button>
                <button
                  onClick={() => { setPurchaseBoosterType('tnt'); setPurchaseModalOpen(true); }}
                  className="flex-1 flex flex-col items-center bg-white rounded-xl px-2 py-2 shadow-sm border border-slate-100 min-w-[80px] hover:scale-105 transition-all"
                >
                  <img src="/assets/boosters/tnt.png" alt="TNT" className="w-16 h-16 object-contain scale-125" />
                  <span className="text-[10px] font-extrabold text-slate-700 bg-white/70 px-2 py-0.5 rounded-full">TNT</span>
                  <span className="text-sm font-black text-red-600 leading-tight">{activeBoosters.tnt}</span>
                </button>
                <button
                  onClick={() => { setPurchaseBoosterType('anchor'); setPurchaseModalOpen(true); }}
                  className="flex-1 flex flex-col items-center bg-white rounded-xl px-2 py-2 shadow-sm border border-slate-100 min-w-[80px] hover:scale-105 transition-all"
                >
                  <img src="/assets/boosters/the_anchor.png" alt="Anchor" className="w-16 h-16 object-contain scale-125" />
                  <span className="text-[10px] font-extrabold text-slate-700 bg-white/70 px-2 py-0.5 rounded-full">Anchor</span>
                  <span className="text-sm font-black text-slate-600 leading-tight">{activeBoosters.anchor}</span>
                </button>
              </div>
            </div>

            <Button
              onClick={handleNextLevel}
              disabled={!upgrades.hasFuel}
              className={`w-full py-4 text-base font-display font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 ${upgrades.hasFuel ? 'animate-pulse ring-4 ring-blue-300' : ''}`}
            >
              {upgrades.hasFuel ? `Set Sail for Level ${currentLevel + 1}!` : "Buy Fuel to Continue"}
            </Button>
          </div>
        )}

        {gameState === "gameover" && (
          <GameOverModal
            score={scoreBreakdown ? scoreBreakdown.finalScore : score}
            island={currentLevel}
            reason={gameOverReason ?? undefined}
            onRetry={() => window.location.reload()}
            scoreBreakdown={scoreBreakdown ?? undefined}
          />
        )}
        {gameState === "win" && (
          <div className="absolute inset-0 bg-green-700/90 z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
            <h2 className="text-5xl font-display font-bold text-white mb-4 uppercase tracking-tighter">You Won</h2>
            <p className="text-white text-lg mb-8 opacity-90 font-medium">You reached all islands. It was a legendary journey!</p>
            <Button onClick={() => window.location.reload()} className="w-full py-8 text-2xl bg-white text-green-700 hover:bg-slate-100 font-display font-bold shadow-xl rounded-2xl">RESTART</Button>
          </div>
        )}

        {/* Pause Menu Overlay */}
        {isPaused && !selectedEntityForInfo && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300 px-8">
            <div className="bg-white rounded-[32px] w-full max-w-xs p-8 shadow-2xl flex flex-col gap-4 border-4 border-white">
              <h2 className="text-3xl font-display font-bold text-slate-800 text-center mb-4">PAUSED</h2>

              <Button
                onClick={togglePause}
                className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Resume
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full py-6 text-lg font-bold border-2 border-slate-100 text-slate-600 hover:bg-slate-50 rounded-2xl flex items-center justify-center gap-3"
              >
                <RotateCcw className="w-5 h-5" />
                Restart
              </Button>

              <Link href="/">
                <Button
                  variant="ghost"
                  className="w-full py-6 text-lg font-bold text-slate-400 hover:text-slate-600 hover:bg-transparent rounded-2xl flex items-center justify-center gap-3"
                >
                  <HomeIcon className="w-5 h-5" />
                  Main Menu
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Info Card Overlay */}
        {selectedEntityForInfo && (
          <div className="z-[110]">
            <InfoCard
              entityKey={selectedEntityForInfo}
              onClose={() => setSelectedEntityForInfo(null)}
            />
          </div>
        )}

        {purchaseBoosterType && (
          <BoosterPurchaseModal
            isOpen={purchaseModalOpen}
            onClose={() => {
              setPurchaseModalOpen(false);
              setPurchaseBoosterType(null);
              if (engineRef.current) {
                engineRef.current.resume();
                setIsPaused(false);
              }
            }}
            boosterType={purchaseBoosterType}
            onPurchase={handlePurchase}
          />
        )}

        <InsufficientFuelModal
          isOpen={showFuelModal}
          onClose={() => setShowFuelModal(false)}
          onWatchAd={() => {
            handleWatchAdForFuel();
            setShowFuelModal(false);
          }}
          onEndGame={() => {
            setGameState("gameover");
            setShowFuelModal(false);
          }}
          fuelCost={fuelCost}
        />

        <GoldDoubloonShopModal
          isOpen={showDoubloonShop}
          onClose={() => {
            setShowDoubloonShop(false);
            if (engineRef.current && isPaused) {
              engineRef.current.resume();
              setIsPaused(false);
            }
          }}
          onPurchase={(doubloons, _price) => {
            const current = getPermanentCoins();
            setPermanentCoins(current + doubloons);
          }}
        />

        {/* Back Link at bottom (only in playing) */}
        {!isPaused && gameState === "playing" && (
          <Link href="/" className="absolute bottom-6 left-6 z-30 p-3 bg-white/20 backdrop-blur rounded-full hover:bg-white/40 transition-colors">
            <ArrowLeft className="text-white w-6 h-6" />
          </Link>
        )}
      </div>
    </div>
  );
}
