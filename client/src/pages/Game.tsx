import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Clock, Fuel, Anchor, Pause, RotateCcw, Home as HomeIcon, Play, Bomb, X } from "lucide-react";
import { GameEngine, CANVAS_WIDTH, CANVAS_HEIGHT, SEA_LEVEL_Y, LEVEL_CONFIG } from "@/game/GameEngine";
import { type TutorialState } from "@/game/TutorialManager";
import { LEVEL_NAMES } from "@/game/levelNames";
import { VEHICLES, getEffectiveStats } from "@/game/vehicles";
import {
  getActiveVehicleId,
  getStoFlags,
  getRodFlags,
  submitPersonalBest,
  type RunScoreBreakdown,
  getStartLevelForMode,
  getAdminMode,
  updateUserUnlockedLevel,
  getPermanentCoins,
  isTutorialCompleted,
  setTutorialCompleted,
  hasTutorialCaught,
  markTutorialCatch,
  setPermanentCoins,
  getPassCards,
  usePassCard,
  addPassCards
} from "@/game/storage";
import { type GameState, type CurseType, type InventoryItem, type FishClass } from "@/game/types";
import { GameOverModal } from "@/components/GameOverModal";
import { CursedLevelCard } from "@/components/CursedLevelCard";
import { PassCardPurchaseModal } from "@/components/PassCardPurchaseModal";
import { BoosterPurchaseModal, type BoosterType } from "@/components/BoosterPurchaseModal";
import { InsufficientFuelModal } from "@/components/InsufficientFuelModal";
import { InsufficientRepairModal } from "@/components/InsufficientRepairModal";
import { GoldDoubloonShopModal } from "@/components/GoldDoubloonShopModal";
import { RegionIntroCard } from "@/components/RegionIntroCard";
import { WelcomeGiftModal } from "@/components/WelcomeGiftModal";
import { MarketTutorialOverlay, MarketTutorialStep } from "@/components/MarketTutorialOverlay";
import { InfoCard } from "@/components/InfoCard";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function Game() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const whirlpoolImgRef = useRef<HTMLImageElement>(null);
  const playAreaRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<"playing" | "gameover" | "shop" | "win">("playing");
  const initialLevel = getStartLevelForMode();

  const [score, setScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<RunScoreBreakdown | null>(null);
  const runStats = useRef({ totalCoins: 0, kingFishCount: 0, maxLevel: initialLevel });
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [anchorEffectTimer, setAnchorEffectTimer] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
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
  const [curseCard, setCurseCard] = useState<CurseType | null>(null);
  const [regionCardStartLevel, setRegionCardStartLevel] = useState<number | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseBoosterType, setPurchaseBoosterType] = useState<BoosterType | null>(null);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showPassCardPurchase, setShowPassCardPurchase] = useState(false);
  const [passCards, setPassCardsState] = useState(() => getPassCards());
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showDoubloonShop, setShowDoubloonShop] = useState(false);
  const [isFuelShopOpened, setIsFuelShopOpened] = useState(false);
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  const [showTutorialPassGift, setShowTutorialPassGift] = useState(false);
  const [showMarketTutorial, setShowMarketTutorial] = useState(false);
  const [marketTutorialStep, setMarketTutorialStep] = useState<MarketTutorialStep>('completed');
  const [discoveryCard, setDiscoveryCard] = useState<FishClass | null>(null);
  const [isGameOverFading, setIsGameOverFading] = useState(false);
  const [perfStats, setPerfStats] = useState<{
    enabled: boolean;
    fps: number;
    avgFrameMs: number;
    avgUpdateMs: number;
    avgDrawMs: number;
    fishCount: number;
    level: number;
  } | null>(null);
  const [tutorialState, setTutorialState] = useState<TutorialState | null>(null);
  const [tntAim, setTntAim] = useState<{ x: number; y: number } | null>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [tntDragged, setTntDragged] = useState(false);
  const [tntDragStart, setTntDragStart] = useState<{ x: number; y: number } | null>(null);

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
  type BoosterState = {
    speed: boolean;
    value: boolean;
    lucky: boolean;
    harpoon: number;
    net: number;
    tnt: number;
    anchor: number;
  };
  const [activeBoosters, setActiveBoosters] = useState<BoosterState>(() => {
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
  const shownCurseLevelsRef = useRef<Set<number>>(new Set());
  const shownRegionLevelsRef = useRef<Set<number>>(new Set());
  const curseCardRef = useRef<CurseType | null>(null);
  const regionCardRef = useRef<number | null>(null);
  const pendingCurseRef = useRef<CurseType | null>(null);

  useEffect(() => {
    localStorage.setItem('global_boosters', JSON.stringify(activeBoosters));
  }, [activeBoosters]);

  useEffect(() => {
    if (currentLevel !== 1) return;
    setActiveBoosters(prev => {
      const next = {
        ...prev,
        harpoon: Math.max(1, Math.floor(prev.harpoon || 0)),
        net: Math.max(1, Math.floor(prev.net || 0)),
        tnt: Math.max(1, Math.floor(prev.tnt || 0)),
        anchor: Math.max(1, Math.floor(prev.anchor || 0))
      };
      if (engineRef.current) {
        engineRef.current.getState().boosters = { ...next };
      }
      return next;
    });
  }, [currentLevel]);

  useEffect(() => {
    curseCardRef.current = curseCard;
  }, [curseCard]);

  useEffect(() => {
    regionCardRef.current = regionCardStartLevel;
  }, [regionCardStartLevel]);

  const handleTriggerGameOver = useCallback((reason: string | null) => {
    setIsGameOverFading(true);
    setTimeout(() => {
      setGameState("gameover");
      setGameOverReason(reason);

      const lastEngine = engineRef.current;
      if (lastEngine) {
        const finalScore = score;
        const finalLevel = currentLevel;

        const baseScore = runStats.current.totalCoins;
        const depthBonus = Math.max(runStats.current.maxLevel, finalLevel) * 50;
        const kingBonus = runStats.current.kingFishCount * 500;
        const totalFinalScore = baseScore + depthBonus + kingBonus;

        // Personal best and record logic only for non-admin mode
        let isNewRecord = false;
        if (!getAdminMode()) {
          isNewRecord = submitPersonalBest(totalFinalScore);
        }

        setScoreBreakdown({
          baseScore,
          depthBonus,
          kingBonus,
          finalScore: totalFinalScore,
          isNewRecord
        });
      }
      setIsGameOverFading(false);
    }, 1000);
  }, [score, currentLevel]);

  useEffect(() => {
    if (!canvasRef.current || !bgCanvasRef.current || gameState !== "playing") return;

    const ctx = canvasRef.current.getContext("2d");
    const bgCtx = bgCanvasRef.current.getContext("2d");
    if (!ctx || !bgCtx) return;

    const levelConfig = LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG];
    const levelCurse = levelConfig?.curse ?? 'none';
    const regionStartLevels = new Set([1, 21, 31, 41, 61, 81]);
    const shouldShowRegion = regionStartLevels.has(currentLevel) && !shownRegionLevelsRef.current.has(currentLevel);
    const shouldShowCurse = levelCurse !== 'none' && !shownCurseLevelsRef.current.has(currentLevel);
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
        caughtEntities: [],
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
      activeCurse: levelCurse,
      curseTimerMs: 0,
      boosters: activeBoosters,
      activeBooster: selectedBooster,
      anchorEffectTimerMs: 0,
      startTimerMs: 750,
      isPaused: shouldShowRegion || shouldShowCurse,
      isTimeFrozen: false
    };

    const engine = new GameEngine(ctx, bgCtx, whirlpoolImgRef.current, initialState, {
      onGameOver: (finalScore, finalLevel, reason) => {
        handleTriggerGameOver(reason ?? null);
      },
      onScoreUpdate: (newScore) => setScore(newScore),
      onEarning: (amount) => {
        runStats.current.totalCoins += amount;
      },
      onLevelComplete: (level) => {
        if (!getAdminMode()) {
          runStats.current.maxLevel = Math.max(runStats.current.maxLevel, level);
          updateUserUnlockedLevel(level + 1);
        }
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

        if (level === 1) {
          if (!isTutorialCompleted()) {
            setTutorialCompleted(true);
            setShowWelcomeGift(true);
            if (engineRef.current) {
              engineRef.current.pause();
              setIsPaused(true);
            }
          }
        }

        setGameState("shop");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      },
      onFishCaught: (fish) => {
        if (fish.type === 'king') {
          runStats.current.kingFishCount++;
        }
        // Discovery Card: Only for non-tutorial levels, if not seen before, and NOT in admin mode
        if (currentLevel > 1 && !getAdminMode() && !hasTutorialCaught(fish.type)) {
          markTutorialCatch(fish.type);
          setDiscoveryCard(fish.type);
          if (engineRef.current) {
            engineRef.current.pause();
            setIsPaused(true);
          }
        }
      },
      onBoosterUsed: (type: 'harpoon' | 'net' | 'tnt' | 'anchor') => {
        setActiveBoosters((prev: BoosterState) => ({
          ...prev,
          [type]: Math.max(0, Math.floor(prev[type] - 1))
        }));
        setSelectedBooster(null);
        const tutorial = engineRef.current?.getTutorialState();
        if (tutorial?.step === 'tnt_action' && type === 'tnt') {
          engineRef.current?.handleTutorialInteraction('drag_tnt_complete');
        } else if (tutorial?.step === 'net_action' && type === 'net') {
          engineRef.current?.handleTutorialInteraction('tap_sea_complete');
        }
      }
    });

    engine.start();
    engineRef.current = engine;

    pendingCurseRef.current = shouldShowCurse ? levelCurse : null;
    if (shouldShowRegion) {
      shownRegionLevelsRef.current.add(currentLevel);
      engine.pause();
      setIsPaused(true);
      setRegionCardStartLevel(currentLevel);
    } else if (shouldShowCurse) {
      shownCurseLevelsRef.current.add(currentLevel);
      engine.pause();
      setIsPaused(true);
      setCurseCard(levelCurse);
    }

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

        const perf = engineRef.current?.getPerfStats();
        if (perf?.enabled) {
          setPerfStats({ ...perf });
        }

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
        const tutorial = engineRef.current?.getTutorialState();
        setTutorialState(tutorial ? { ...tutorial } : null);
        const hook = engineRef.current?.getState().hook;
        if (hook?.state === 'tnt_aiming' && hook.targetX !== undefined && hook.targetY !== undefined) {
          setTntAim({ x: hook.targetX, y: hook.targetY });
        } else {
          setTntAim(null);
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

  const tutorialAction = tutorialState?.allowedAction ?? null;
  const tutorialFrozen = Boolean(tutorialState?.isFrozen);
  const isTntAction = tutorialState?.step === 'tnt_action';
  const isHarpoonAction = tutorialState?.step === 'harpoon_action';
  const allowPointerDown = !tutorialFrozen || tutorialAction === 'drag_tnt' || tutorialAction === 'tap_sea' || tutorialAction === 'aim_harpoon' || tutorialAction === 'tap_anywhere';
  const allowPointerMove = !tutorialFrozen || tutorialAction === 'drag_tnt' || tutorialAction === 'aim_harpoon';
  const overlayBlocksInput = tutorialFrozen && (tutorialAction === 'tap_tnt' || tutorialAction === 'tap_net' || tutorialAction === 'tap_harpoon' || tutorialAction === 'tap_anchor' || tutorialAction === 'tap_anywhere');
  const overlayOpacity = tutorialState?.overlayOpacity ?? 0.75;
  const isLevel2Tutorial = currentLevel === 2 && tutorialFrozen;
  const tntGridSize = 240;

  const tutorialTarget = (() => {
    if (!tutorialState?.targetFishIds.length) return null;
    const engine = engineRef.current;
    if (!engine) return null;
    const targets = engine.getState().fishes.filter(fish => tutorialState.targetFishIds.includes(fish.id));
    if (targets.length === 0) return null;
    const sum = targets.reduce((acc, fish) => ({ x: acc.x + fish.x, y: acc.y + fish.y }), { x: 0, y: 0 });
    const centerX = sum.x / targets.length;
    const centerY = sum.y / targets.length;
    const radius = Math.max(40, ...targets.map(fish => Math.hypot(fish.x - centerX, fish.y - centerY) + fish.radius));
    return { centerX, centerY, radius, type: targets[0].type };
  })();

  const clampTntCenter = (center: { x: number; y: number }) => {
    const half = tntGridSize / 2;
    const minX = half;
    const maxX = CANVAS_WIDTH - half;
    const minY = SEA_LEVEL_Y + half;
    const maxY = CANVAS_HEIGHT - half;
    return {
      x: Math.min(maxX, Math.max(minX, center.x)),
      y: Math.min(maxY, Math.max(minY, center.y))
    };
  };

  const tntCenter = (() => {
    if (!tutorialTarget) return null;
    return clampTntCenter({ x: tutorialTarget.centerX, y: tutorialTarget.centerY });
  })();

  const tntPreviewCenter = (() => {
    if (!isTntAction || tutorialAction !== 'drag_tnt' || !isPointerDown || !tntAim) return null;
    return clampTntCenter(tntAim);
  })();

  const spotlightFish = (() => {
    if (!tutorialFrozen || tutorialState?.spotlightTarget !== 'target_fish' || isTntAction) return null;
    const engine = engineRef.current;
    const rect = playAreaRef.current?.getBoundingClientRect();
    if (!engine || !rect || !tutorialTarget) return null;
    const scaleX = rect.width / CANVAS_WIDTH;
    const scaleY = rect.height / CANVAS_HEIGHT;
    const radius = Math.max(60, tutorialTarget.radius * Math.max(scaleX, scaleY) + 30);
    return {
      x: tutorialTarget.centerX * scaleX,
      y: tutorialTarget.centerY * scaleY,
      radius
    };
  })();

  const harpoonGuide = (() => {
    if (!tutorialFrozen || tutorialState?.step !== 'harpoon_action') return null;
    const engine = engineRef.current;
    const rect = playAreaRef.current?.getBoundingClientRect();
    if (!engine || !rect || !tutorialTarget) return null;
    const pivot = engine.getHookPivotPositionOnCanvas();
    const scaleX = rect.width / CANVAS_WIDTH;
    const scaleY = rect.height / CANVAS_HEIGHT;
    const startX = pivot.x * scaleX;
    const startY = pivot.y * scaleY;
    const endX = tutorialTarget.centerX * scaleX;
    const endY = tutorialTarget.centerY * scaleY;
    const length = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX);
    return { startX, startY, length, angle };
  })();

  const overlayBackground = tutorialFrozen && !isHarpoonAction && !isTntAction && tutorialAction !== 'tap_sea'
    ? spotlightFish
      ? `radial-gradient(circle ${spotlightFish.radius}px at ${spotlightFish.x}px ${spotlightFish.y}px, rgba(0,0,0,0) 0, rgba(0,0,0,0) ${spotlightFish.radius}px, rgba(0,0,0,${overlayOpacity}) ${spotlightFish.radius + 40}px)`
      : (tutorialState?.spotlightTarget === 'character'
        ? `radial-gradient(circle 120px at 50% ${SEA_LEVEL_Y}px, rgba(0,0,0,0) 0, rgba(0,0,0,0) 80px, rgba(0,10,30,${overlayOpacity}) 120px)`
        : (isLevel2Tutorial ? `rgba(0,10,30,${overlayOpacity})` : `rgba(0,0,0,${overlayOpacity})`))
    : undefined;
  const blurOverlayEnabled = Boolean(overlayBackground);
  const spotlightMask = (() => {
    if (!tutorialFrozen) return undefined;
    if (tutorialState?.spotlightTarget === 'character') {
      return `radial-gradient(circle 120px at 50% ${SEA_LEVEL_Y}px, transparent 80px, black 120px)`;
    }
    if (spotlightFish) {
      return `radial-gradient(circle ${spotlightFish.radius}px at ${spotlightFish.x}px ${spotlightFish.y}px, transparent 0px, transparent ${spotlightFish.radius}px, black ${spotlightFish.radius + 40}px)`;
    }
    return undefined;
  })();

  const boosterItems = [
    { id: 'harpoon', imageSrc: '/assets/boosters/harpoon.png', label: 'Harpoon', count: activeBoosters.harpoon },
    { id: 'net', imageSrc: '/assets/boosters/net.png', label: 'Net', count: activeBoosters.net },
    { id: 'tnt', imageSrc: '/assets/boosters/tnt.png', label: 'TNT', count: activeBoosters.tnt },
    { id: 'anchor', imageSrc: '/assets/boosters/the_anchor.png', label: 'Anchor', count: activeBoosters.anchor },
  ];
  const tutorialBoosterId = tutorialFrozen && tutorialState?.spotlightTarget?.endsWith('_btn')
    ? tutorialState.spotlightTarget.replace('_btn', '')
    : null;
  const isTutorialActive = Boolean(tutorialState && tutorialState.step !== 'completed');
  const visibleBoosters = isTutorialActive
    ? (tutorialBoosterId ? boosterItems.filter(item => item.id === tutorialBoosterId) : [])
    : boosterItems;

  useEffect(() => {
    if (tutorialState?.step !== 'tnt_action') return;
    if (!tntCenter) return;
    engineRef.current?.setTutorialTntAim(tntCenter.x, tntCenter.y);
  }, [tutorialState?.step, tutorialState?.targetFishIds.join(','), tntCenter?.x, tntCenter?.y]);

  useEffect(() => {
    if (tutorialState?.step === 'net_action') {
      setSelectedBooster('net');
      if (engineRef.current) {
        engineRef.current.getState().activeBooster = 'net';
      }
    }
    if (tutorialState?.step === 'harpoon_action') {
      setSelectedBooster('harpoon');
      if (engineRef.current) {
        engineRef.current.getState().activeBooster = 'harpoon';
      }
    }
  }, [tutorialState?.step]);

  const handleBoosterClick = (booster: { id: string; count: number }) => {
    // End-of-level protection: No boosters in final second
    if (timeLeft <= 1) return;

    const tutorial = engineRef.current?.getTutorialState();
    if (isTutorialActive) {
      const allowedMap: Record<string, string> = {
        tap_tnt: 'tnt',
        tap_net: 'net',
        tap_harpoon: 'harpoon',
        tap_anchor: 'anchor'
      };
      const allowedBooster = tutorialAction ? allowedMap[tutorialAction] : null;
      if (allowedBooster !== booster.id) return;
    }
    if (tutorial?.isFrozen) {
      const allowed = tutorial.allowedAction;
      const isAllowed = (booster.id === 'tnt' && allowed === 'tap_tnt')
        || (booster.id === 'net' && allowed === 'tap_net')
        || (booster.id === 'harpoon' && allowed === 'tap_harpoon')
        || (booster.id === 'anchor' && allowed === 'tap_anchor');
      if (!isAllowed) return;
      if (allowed) {
        engineRef.current?.handleTutorialInteraction(allowed);
      }
      if (allowed === 'tap_anchor') return;
    }

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
  };

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
    const isReverseMarket = activeCurse === 'reverse_market' || activeCurse === 'final_3';
    const totalValue = inventory.reduce((sum, item) => {
      const value = isReverseMarket ? Math.round(item.value * 0.5) : item.value;
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

    if (showMarketTutorial && marketTutorialStep === 'sell') {
      setMarketTutorialStep('fuel');
    }
  };

  const handleClaimGift = () => {
    setActiveBoosters(prev => {
      const next = {
        ...prev,
        harpoon: Math.max(0, Math.floor((prev.harpoon || 0) + 2)),
        net: Math.max(0, Math.floor((prev.net || 0) + 2)),
        tnt: Math.max(0, Math.floor((prev.tnt || 0) + 2)),
        anchor: Math.max(0, Math.floor((prev.anchor || 0) + 2))
      };
      localStorage.setItem('global_boosters', JSON.stringify(next));
      if (engineRef.current) {
        engineRef.current.getState().boosters = { ...next };
        engineRef.current.resume();
        setIsPaused(false);
      }
      return next;
    });
    setShowWelcomeGift(false);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });

    // Start market tutorial if not completed
    const marketDone = localStorage.getItem('market_tutorial_v10') === 'true';
    if (!marketDone) {
      setMarketTutorialStep('sell');
      setShowMarketTutorial(true);
    }
  };

  const buyFuel = () => {
    if (upgrades.hasFuel) return;
    const effectiveCost = currentLevel === 1 ? score : fuelCost;
    if (score < effectiveCost) {
      setShowFuelModal(true);
      return;
    }

    setScore(prev => prev - effectiveCost);
    setUpgrades(prev => ({ ...prev, hasFuel: true }));

    if (engineRef.current) {
      engineRef.current.getState().score -= effectiveCost;
      engineRef.current.getState().upgrades.hasFuel = true;
    }

    if (showMarketTutorial && marketTutorialStep === 'fuel') {
      setMarketTutorialStep('pass');
    }
  };

  const getSawtoothFactor = (level: number) => {
    const blockIndex = Math.floor((level - 1) / 5);
    const blockStart = blockIndex * 5 + 1;
    const progress = (level - blockStart) / 4;
    const regionIndex = Math.floor((level - 1) / 20);
    const saw = 0.85 + progress * 0.3;
    const region = 1 + regionIndex * 0.12;
    const block = 1 + blockIndex * 0.02;
    return saw * region * block;
  };
  const repairCost = Math.max(1, Math.round(60 * getSawtoothFactor(currentLevel)));
  const AD_REWARD = 50;

  const repairHook = (amount: number) => {
    if (hookAttempts >= maxHookAttempts) return;
    if (score < repairCost) {
      setShowRepairModal(true);
      return;
    }

    const newAttempts = Math.min(maxHookAttempts, hookAttempts + amount);
    setScore(prev => prev - repairCost);
    setHookAttempts(newAttempts);

    if (engineRef.current) {
      engineRef.current.getState().score -= repairCost;
      engineRef.current.getState().hookAttempts = newAttempts;
    }
  };

  const handleWatchAdReward = () => {
    setScore(prev => prev + AD_REWARD);
    if (engineRef.current) {
      engineRef.current.getState().score += AD_REWARD;
    }
  };

  const handleNextLevel = () => {
    if (!upgrades.hasFuel) return;

    if (showMarketTutorial && marketTutorialStep === 'continue') {
      setMarketTutorialStep('completed');
      setShowMarketTutorial(false);
      localStorage.setItem('market_tutorial_v10', 'true');
    }

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
  const isReverseWeight = activeCurse === 'reverse_weight' || activeCurse === 'final_3';
  const kingDisplayOffset = activeVehicleId === 't7' && inventory.some(item => item.type === 'king') ? -5 : 0;
  const displayWeight = Math.max(0, baseWeight + weightDisplayOffset + kingDisplayOffset);

  // 'ters_agirlik' curse: gauge turns reverse (%0=full, %100=empty)
  const rawStorageRatio = (displayWeight / upgrades.storageCapacity) || 0;
  const storageRatio = isReverseWeight ? (1 - rawStorageRatio) : rawStorageRatio;
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

  const isReverseMarket = activeCurse === 'reverse_market' || activeCurse === 'final_3';
  const groupedInventory = inventory
    .filter(item => item.type !== 'env_bubbles')
    .reduce((acc, item) => {
      const existing = acc.find(i => i.type === item.type);
      if (existing) {
        existing.count++;
        existing.totalValue += isReverseMarket ? Math.round(item.value * 0.5) : item.value;
      } else {
        acc.push({
          id: item.id,
          type: item.type,
          name: item.name,
          count: 1,
          totalValue: isReverseMarket ? Math.round(item.value * 0.5) : item.value
        });
      }
      return acc;
    }, [] as { id: string, type: FishClass, name: string, count: number, totalValue: number }[]);

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

  return (
    <div className="relative w-full h-screen bg-slate-900 flex items-center justify-center overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
      <div ref={playAreaRef} className="relative w-full h-full max-w-[450px] max-h-[800px] bg-sky-100 shadow-2xl overflow-hidden md:rounded-[32px] md:border-8 md:border-slate-800">

        {/* Playable Area */}
        {gameState === "playing" && (
          <>
            <div className={`absolute top-0 left-0 right-0 p-4 pt-safe flex justify-between items-start pointer-events-none px-safe transition-all ${isLevel2Tutorial && (tutorialState?.spotlightTarget === 'storage_panel' || tutorialState?.spotlightTarget === 'hook_panel') ? 'z-50' : 'z-10'}`}>
              <div className="flex items-center gap-2 pointer-events-auto">
                {currentLevel !== 1 && (
                  <div className={`border-2 border-white rounded-xl px-2 py-1.5 shadow-md flex items-center gap-1.5 shrink-0 ${anchorEffectTimer > 0 ? 'bg-green-500 animate-pulse' : 'bg-[#99E5FF]'}`}>
                    <Clock className={`w-4 h-4 text-white ${anchorEffectTimer > 0 ? 'fill-green-700' : 'fill-[#FFB347]'}`} />
                    <span className="text-lg font-display font-bold text-white whitespace-nowrap">
                      {anchorEffectTimer > 0
                        ? formatTime(Math.ceil(anchorEffectTimer / 1000))
                        : formatTime(timeLeft)}
                    </span>
                  </div>
                )}
                <button
                  onClick={togglePause}
                  className="bg-white/90 backdrop-blur-sm border-2 border-white rounded-xl p-2 shadow-md hover:scale-105 transition-transform active:scale-95 shrink-0"
                >
                  <Pause className="w-5 h-5 text-slate-600 fill-slate-600" />
                </button>
              </div>

              {currentLevel !== 1 && (
                <div className="flex flex-col gap-2 items-end">
                  {/* Storage Bar */}
                  <div className={`bg-white/90 backdrop-blur-sm border-2 border-white rounded-xl p-2 shadow-md w-32 flex flex-col gap-1 transition-all ${tutorialState?.spotlightTarget === 'storage_panel' ? 'z-[60] relative animate-pulse ring-4 ring-yellow-400' : ''}`}>
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
                  <div className={`bg-white/90 backdrop-blur-sm border-2 border-white rounded-xl p-2 shadow-md w-32 flex items-center justify-between text-xs font-bold text-slate-700 ${tutorialState?.spotlightTarget === 'hook_panel' ? 'z-[60] relative animate-pulse ring-4 ring-yellow-400' : ''}`}>
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
              )}
            </div>
            <canvas ref={bgCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0 w-full h-full block" style={{ zIndex: 0 }} />
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={(e) => {
                setIsPointerDown(true);
                setTntDragged(false);
                if (tutorialFrozen && tutorialState?.step === 'anchor_action' && tutorialAction === 'tap_sea') {
                  engineRef.current?.activateAnchor();
                  engineRef.current?.handleTutorialInteraction('tap_sea_complete');
                  return;
                }
                if (!allowPointerDown) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
                const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

                // 1. Check for catch card clicks FIRST
                if (engineRef.current) {
                  const clickedType = engineRef.current.getCaughtItemAt(x, y);
                  if (clickedType) {
                    setDiscoveryCard(clickedType);
                    engineRef.current.pause();
                    setIsPaused(true);
                    return; // Stop here, don't cast!
                  }
                }

                // 2. Otherwise proceed with normal input
                if (isTntAction && tutorialAction === 'drag_tnt') {
                  setTntAim({ x, y });
                  setTntDragStart({ x, y });
                }
                engineRef.current?.handlePointerDown(x, y);
              }}
              onPointerMove={(e) => {
                if (!allowPointerMove) return;
                if (isTntAction && tutorialAction === 'drag_tnt' && !isPointerDown) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
                const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
                if (isTntAction && tutorialAction === 'drag_tnt') {
                  if (tntDragStart) {
                    const dist = Math.hypot(x - tntDragStart.x, y - tntDragStart.y);
                    if (dist > 6) {
                      setTntDragged(true);
                    }
                  }
                  setTntAim({ x, y });
                }
                engineRef.current?.handlePointerMove(x, y);
              }}
              onPointerUp={(e) => {
                setIsPointerDown(false);
                setTntDragStart(null);
                if (isTntAction && tutorialAction === 'drag_tnt' && !tntDragged) return;
                if (!allowPointerDown) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
                const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
                engineRef.current?.handlePointerUp(x, y);
              }}
              className="absolute inset-0 w-full h-full block touch-none"
              style={{ zIndex: 1, pointerEvents: allowPointerDown ? 'auto' : 'none' }}
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
            {perfStats?.enabled && (
              <div className="absolute left-3 bottom-3 z-50 bg-black/60 text-white text-[10px] rounded-md px-2 py-1 font-mono">
                <div>fps: {perfStats.fps}</div>
                <div>frame: {perfStats.avgFrameMs}ms</div>
                <div>update: {perfStats.avgUpdateMs}ms</div>
                <div>draw: {perfStats.avgDrawMs}ms</div>
                <div>fish: {perfStats.fishCount}</div>
                <div>level: {perfStats.level}</div>
              </div>
            )}
            {tutorialFrozen && overlayBackground && blurOverlayEnabled && !isTntAction && (
              <div
                className="absolute inset-0 z-40 backdrop-blur-sm"
                onClick={() => {
                  if (tutorialAction === 'tap_anywhere') {
                    engineRef.current?.handleTutorialInteraction('tap_anywhere');
                  }
                }}
                style={{
                  background: overlayBackground,
                  pointerEvents: overlayBlocksInput ? 'auto' : 'none',
                  WebkitMaskImage: spotlightMask,
                  maskImage: spotlightMask
                }}
              />
            )}
            {tutorialFrozen && overlayBackground && !blurOverlayEnabled && !isTntAction && (
              <div
                className="absolute inset-0 z-40"
                onClick={() => {
                  if (tutorialAction === 'tap_anywhere') {
                    engineRef.current?.handleTutorialInteraction('tap_anywhere');
                  }
                }}
                style={{ background: overlayBackground, pointerEvents: overlayBlocksInput ? 'auto' : 'none' }}
              />
            )}
            {tutorialFrozen && isTntAction && tntCenter && (
              (() => {
                const rect = playAreaRef.current?.getBoundingClientRect();
                if (!rect) return null;
                const scaleX = rect.width / CANVAS_WIDTH;
                const scaleY = rect.height / CANVAS_HEIGHT;
                const targetWidth = tntGridSize * scaleX;
                const targetHeight = tntGridSize * scaleY;
                const targetLeft = tntCenter.x * scaleX - targetWidth / 2;
                const targetTop = tntCenter.y * scaleY - targetHeight / 2;
                const targetRect = {
                  left: targetLeft,
                  top: targetTop,
                  right: targetLeft + targetWidth,
                  bottom: targetTop + targetHeight,
                  width: targetWidth,
                  height: targetHeight
                };
                const previewRect = tntPreviewCenter
                  ? (() => {
                    const width = tntGridSize * scaleX;
                    const height = tntGridSize * scaleY;
                    const left = tntPreviewCenter.x * scaleX - width / 2;
                    const top = tntPreviewCenter.y * scaleY - height / 2;
                    return { left, top, right: left + width, bottom: top + height, width, height };
                  })()
                  : null;
                const windows = previewRect ? [targetRect, previewRect] : [targetRect];
                const xs = Array.from(new Set([0, rect.width, ...windows.flatMap(w => [w.left, w.right])])).sort((a, b) => a - b);
                const ys = Array.from(new Set([0, rect.height, ...windows.flatMap(w => [w.top, w.bottom])])).sort((a, b) => a - b);
                const blurRects: Array<{ left: number; top: number; width: number; height: number }> = [];
                for (let i = 0; i < xs.length - 1; i++) {
                  for (let j = 0; j < ys.length - 1; j++) {
                    const left = xs[i];
                    const top = ys[j];
                    const right = xs[i + 1];
                    const bottom = ys[j + 1];
                    const insideWindow = windows.some(w => left >= w.left && right <= w.right && top >= w.top && bottom <= w.bottom);
                    if (!insideWindow) {
                      blurRects.push({ left, top, width: right - left, height: bottom - top });
                    }
                  }
                }
                return (
                  <>
                    {blurRects.map((cell, idx) => (
                      <div
                        key={`tnt-blur-${idx}`}
                        className="absolute z-40 backdrop-blur-sm pointer-events-none"
                        style={{
                          left: cell.left,
                          top: cell.top,
                          width: cell.width,
                          height: cell.height,
                          background: `rgba(0,0,0,${overlayOpacity})`
                        }}
                      />
                    ))}
                    <div
                      className="absolute z-50 pointer-events-none"
                      style={{
                        left: targetRect.left,
                        top: targetRect.top,
                        width: targetRect.width,
                        height: targetRect.height,
                        backgroundColor: 'rgba(160,160,160,0.18)',
                        backgroundImage: 'linear-gradient(to right, rgba(180,180,180,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(180,180,180,0.8) 1px, transparent 1px)',
                        backgroundSize: `${targetRect.width / 3}px ${targetRect.height / 3}px`,
                        border: '2px solid rgba(180,180,180,0.9)',
                        boxShadow: '0 0 16px rgba(180,180,180,0.6)'
                      }}
                    />
                    {previewRect && (
                      <div
                        className="absolute z-50 pointer-events-none"
                        style={{
                          left: previewRect.left,
                          top: previewRect.top,
                          width: previewRect.width,
                          height: previewRect.height,
                          backgroundColor: 'rgba(255,60,60,0.12)',
                          backgroundImage: 'linear-gradient(to right, rgba(255,90,90,0.9) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,90,90,0.9) 1px, transparent 1px)',
                          backgroundSize: `${previewRect.width / 3}px ${previewRect.height / 3}px`,
                          border: '2px solid rgba(255,90,90,0.95)',
                          boxShadow: '0 0 24px rgba(255,90,90,0.7)'
                        }}
                      />
                    )}
                  </>
                );
              })()
            )}
            {isHarpoonAction && harpoonGuide && (
              (() => {
                const radius = Math.max(140, harpoonGuide.length);
                const startAngle = harpoonGuide.angle - Math.PI / 2;
                const endAngle = harpoonGuide.angle + Math.PI / 2;
                const cx = harpoonGuide.startX;
                const cy = harpoonGuide.startY;
                const startX = cx + radius * Math.cos(startAngle);
                const startY = cy + radius * Math.sin(startAngle);
                const endX = cx + radius * Math.cos(endAngle);
                const endY = cy + radius * Math.sin(endAngle);
                return (
                  <svg
                    className="absolute z-50 pointer-events-none"
                    style={{
                      left: cx - radius,
                      top: cy - radius,
                      width: radius * 2,
                      height: radius * 2
                    }}
                  >
                    <path
                      d={`M ${startX - (cx - radius)} ${startY - (cy - radius)} A ${radius} ${radius} 0 0 1 ${endX - (cx - radius)} ${endY - (cy - radius)}`}
                      stroke="rgba(255,255,255,0.75)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                );
              })()
            )}
            {isHarpoonAction && tutorialTarget && (
              (() => {
                const rect = playAreaRef.current?.getBoundingClientRect();
                if (!rect) return null;
                const scaleX = rect.width / CANVAS_WIDTH;
                const scaleY = rect.height / CANVAS_HEIGHT;
                const size = Math.max(70, tutorialTarget.radius * Math.max(scaleX, scaleY) * 2.2);
                const left = tutorialTarget.centerX * scaleX - size / 2;
                const top = tutorialTarget.centerY * scaleY - size / 2;
                return (
                  <img
                    src={`/assets/fish/${tutorialTarget.type}_fish.png`}
                    alt=""
                    className="absolute z-50 animate-pulse"
                    style={{
                      left,
                      top,
                      width: size,
                      height: size,
                      filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.9))'
                    }}
                  />
                );
              })()
            )}
            {spotlightFish && (
              <div
                className="absolute z-50 rounded-full border-2 border-yellow-300 animate-pulse pointer-events-none"
                style={{
                  left: spotlightFish.x - spotlightFish.radius,
                  top: spotlightFish.y - spotlightFish.radius,
                  width: spotlightFish.radius * 2,
                  height: spotlightFish.radius * 2,
                  boxShadow: '0 0 30px rgba(255,215,0,0.85)'
                }}
              />
            )}
            {harpoonGuide && (
              <div
                className="absolute z-50 pointer-events-none"
                style={{
                  left: harpoonGuide.startX,
                  top: harpoonGuide.startY,
                  width: harpoonGuide.length,
                  height: 4,
                  transformOrigin: '0 50%',
                  transform: `rotate(${harpoonGuide.angle}rad)`,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0))',
                  boxShadow: '0 0 12px rgba(255,255,255,0.6)'
                }}
              />
            )}
            {tutorialState?.overlayText && (
              <div className={`absolute inset-x-0 z-50 flex justify-center pointer-events-none px-6 transition-all duration-500 ${tutorialState.step === 'l2_final' ? 'top-1/2 -translate-y-1/2' : (tutorialState.step === 'l2_storage' || tutorialState.step === 'l2_hook') ? 'top-[160px]' : 'top-8'}`}>
                <div className="bg-black/85 backdrop-blur-md border-4 border-yellow-400 rounded-[24px] px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] max-w-xs relative flex flex-col gap-4">
                  <div className="text-xl font-display font-black text-yellow-400 text-center uppercase tracking-wide leading-tight">
                    {tutorialState.overlayText}
                  </div>
                  {isLevel2Tutorial && (
                    <div className="flex items-center justify-between w-full pointer-events-auto mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          engineRef.current?.handleTutorialInteraction('prev_step');
                        }}
                        className={`text-xs font-bold text-white/70 hover:text-white transition-colors border border-white/20 rounded-xl px-4 py-1.5 hover:bg-white/5 active:scale-95 ${tutorialState.step === 'l2_storage' ? 'opacity-0 pointer-events-none' : ''}`}
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          engineRef.current?.handleTutorialInteraction('skip_tutorial');
                        }}
                        className="text-[10px] font-black text-white/30 hover:text-white/60 transition-colors uppercase tracking-[0.15em]"
                      >
                        Skip
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          engineRef.current?.handleTutorialInteraction('next_step');
                        }}
                        className="text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors border border-yellow-400/40 rounded-xl px-5 py-1.5 hover:bg-yellow-400/5 active:scale-95 flex items-center gap-1 shadow-[0_0_15px_rgba(250,204,21,0.1)]"
                      >
                        {tutorialState.step === 'l2_final' ? 'Let\'s Go!' : 'Next →'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
              {visibleBoosters.map((booster) => {
                const spotlighted = tutorialFrozen && tutorialState?.spotlightTarget === `${booster.id}_btn`;
                const pointerEnabled = !tutorialFrozen || spotlighted;
                return (
                  <button
                    key={booster.id}
                    onClick={() => handleBoosterClick(booster)}
                    className={`relative w-20 h-20 flex items-center justify-center transition-all ${booster.count === 0
                      ? 'opacity-50 grayscale hover:scale-105'
                      : selectedBooster === booster.id
                        ? 'scale-125 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]'
                        : 'hover:scale-110 drop-shadow-md'
                      } ${spotlighted ? 'scale-125 drop-shadow-[0_0_20px_rgba(255,215,0,0.9)] animate-pulse' : ''}`}
                    style={{ pointerEvents: pointerEnabled ? 'auto' : 'none', zIndex: spotlighted ? 60 : undefined }}
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
                );
              })}
            </div>
          </>
        )}

        {/* Shop UI (Market / Capacity Shock) */}
        {gameState === "shop" && (
          <div className="absolute inset-0 z-20 p-3 flex flex-col gap-2 overflow-y-auto hide-scrollbar bg-gradient-to-b from-sky-50/50 to-white/95 backdrop-blur-xl animate-in fade-in duration-500">
            <style>{`
              .btn-3d {
                position: relative;
                transition: all 0.1s ease;
                border-radius: 12px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              }
              .btn-3d:active {
                transform: translateY(3px);
                border-bottom-width: 0px !important;
              }
              .btn-green  { background: #2ECC71; border-bottom: 4px solid #27AE60; color: white; }
              .btn-red    { background: #FF4757; border-bottom: 4px solid #D63031; color: white; }
              .btn-blue   { background: #3498DB; border-bottom: 4px solid #2980B9; color: white; }
              .btn-yellow { background: #F1C40F; border-bottom: 4px solid #D4AC0D; color: white; }
              .btn-indigo { background: #5865F2; border-bottom: 4px solid #4752C4; color: white; }
              .btn-disabled { background: #D1D5DB; border-bottom: 4px solid #9CA3AF; color: #6B7280; cursor: not-allowed; }

              .ocean-card {
                background: rgba(255, 255, 255, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.6);
                border-radius: 20px;
                padding: 12px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
              }
              .section-header {
                font-size: 10px;
                font-weight: 900;
                color: #94A3B8;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 8px;
                padding-left: 2px;
              }
            `}</style>
            
            <div className="text-center relative pt-1">
              <Link href="/">
                <button className="absolute left-0 top-1 w-10 h-10 bg-white/60 backdrop-blur-sm rounded-xl text-slate-500 hover:text-blue-600 transition-all border-b-2 border-slate-200 active:translate-y-0.5 active:border-b-0 flex items-center justify-center">
                  <HomeIcon className="w-5 h-5" />
                </button>
              </Link>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 text-[9px] uppercase font-black tracking-widest leading-none mb-1 opacity-80">
                  {currentLevel === 1 ? "Training Bay" : `Island Level ${currentLevel - 1}`}
                </span>
                <h2 className="text-xl font-display font-black text-slate-800 leading-tight">
                  {currentLevel === 1 ? "Tutorial Harbor" : (LEVEL_NAMES[currentLevel] ?? "Deep Sea Market")}
                </h2>
              </div>
              <div className="mt-1.5 text-xl font-black text-green-600 flex items-center justify-center gap-1.5 grayscale-[0.2]">
                <img src="/assets/environment/gold_doubloon.png" alt="" className="w-5 h-5 object-contain" />
                {score}
              </div>
            </div>

            {/* Sell Section */}
            <div className="ocean-card">
              <div className="flex justify-between items-center mb-2 px-1">
                <div className="section-header !mb-0">Sell Your Haul</div>
                <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">{inventory.length} Fish</div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar mb-2">
                {groupedInventory.length === 0 ? (
                  <div className="w-full text-center py-4 text-[11px] font-bold text-slate-400 italic bg-white/20 rounded-xl border border-dashed border-white/60">
                    Empty nets...
                  </div>
                ) : (
                  groupedInventory.map(item => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-24 bg-white/50 rounded-xl p-2 flex flex-col items-center shadow-sm border border-white"
                    >
                      <div className="relative w-12 h-12 flex items-center justify-center mb-1">
                        <img
                          src={resolveInventoryImage(item.type)}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                        {item.count > 1 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                            {item.count}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-slate-700 text-center line-clamp-1">{item.name}</span>
                      <span className="text-[10px] font-bold text-green-600 mt-0.5 flex items-center gap-0.5">
                        <img src="/assets/environment/gold_doubloon.png" alt="" className="w-3 h-3 object-contain" />{item.totalValue}
                      </span>
                    </div>
                  ))
                )}
              </div>
              
              <button
                id="market-sell-all"
                onClick={handleSellAll}
                disabled={inventory.length === 0 && (!showMarketTutorial || marketTutorialStep !== 'sell')}
                className={`w-full h-11 btn-3d ${inventory.length === 0 ? 'btn-disabled' : 'btn-green'}`}
                style={{ zIndex: marketTutorialStep === 'sell' ? 9999 : undefined }}
              >
                Sell All
              </button>
            </div>

            {/* Services */}
            <div className="ocean-card">
              <div className="section-header">Boat Services</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="market-buy-fuel"
                  onClick={buyFuel}
                  disabled={upgrades.hasFuel && (!showMarketTutorial || marketTutorialStep !== 'fuel')}
                  className={`h-11 btn-3d flex flex-col !gap-0 !py-1 ${upgrades.hasFuel ? 'btn-disabled' : 'btn-red'}`}
                  style={{ zIndex: marketTutorialStep === 'fuel' ? 9999 : undefined }}
                >
                  <div className="flex items-center gap-1.5">
                    <Fuel className="w-4 h-4" />
                    <span className="text-[11px]">Refill Fuel</span>
                  </div>
                  <span className="text-[9px] opacity-80">{currentLevel === 1 ? "FREE" : `${fuelCost} 🪙`}</span>
                </button>

                <button
                  onClick={() => repairHook(1)}
                  disabled={hookAttempts >= maxHookAttempts}
                  className={`h-11 btn-3d flex flex-col !gap-0 !py-1 ${hookAttempts >= maxHookAttempts ? 'btn-disabled' : 'btn-yellow'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Anchor className="w-4 h-4" />
                    <span className="text-[11px]">Repair Rod</span>
                  </div>
                  <span className="text-[9px] opacity-80">{repairCost} 🪙</span>
                </button>
              </div>

              {(!upgrades.hasFuel || (showMarketTutorial && marketTutorialStep === 'pass')) && (
                <button
                  id="market-use-pass"
                  onClick={() => {
                    if (showMarketTutorial && marketTutorialStep === 'pass' && passCards === 0) {
                      setShowTutorialPassGift(true);
                      return;
                    }
                    if (passCards > 0) {
                      if (usePassCard()) {
                        setPassCardsState(getPassCards());
                        setUpgrades(prev => ({ ...prev, hasFuel: true }));
                        if (showMarketTutorial && marketTutorialStep === 'pass') {
                          setMarketTutorialStep('continue');
                        }
                      }
                    } else {
                      setShowPassCardPurchase(true);
                    }
                  }}
                  className="w-full h-11 mt-2 btn-3d btn-indigo text-[11px]"
                  style={{ zIndex: marketTutorialStep === 'pass' ? 9999 : undefined }}
                >
                  <img src="/assets/pass_card.png" alt="" className="w-4 h-5 object-contain" />
                  {passCards > 0 ? `Use Pass (${passCards})` : "Get Pass Card"}
                </button>
              )}
            </div>

            {/* Power-ups Section */}
            <div className="flex flex-col items-center">
              <div className="section-header !text-center !mb-1">Power-up Collection</div>
              <div className="flex gap-1 items-center justify-center">
                {[
                  { id: 'harpoon', icon: '/assets/boosters/harpoon.png', count: activeBoosters.harpoon },
                  { id: 'net', icon: '/assets/boosters/net.png', count: activeBoosters.net },
                  { id: 'tnt', icon: '/assets/boosters/tnt.png', count: activeBoosters.tnt },
                  { id: 'anchor', icon: '/assets/boosters/the_anchor.png', count: activeBoosters.anchor }
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setPurchaseBoosterType(b.id as any); setPurchaseModalOpen(true); }}
                    className="relative group hover:scale-110 active:scale-95 transition-all"
                  >
                    <img src={b.icon} alt={b.id} className="w-24 h-24 object-contain drop-shadow-xl" />
                    <span className="absolute top-2 right-1 bg-red-500 text-white text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-md z-10">
                      {b.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Final Actions */}
            <div className="flex flex-col gap-2 mt-auto pt-2">
              <button
                id="market-next-level"
                onClick={handleNextLevel}
                disabled={!upgrades.hasFuel && (!showMarketTutorial || marketTutorialStep !== 'continue')}
                className={`w-full h-14 btn-3d !text-lg ${upgrades.hasFuel ? 'btn-green ring-4 ring-green-400/20' : 'btn-disabled opacity-60'}`}
              >
                {upgrades.hasFuel ? "Set Sail!" : "Needs Fuel"}
              </button>

              <button
                onClick={() => {
                  if (confirm("End current journey? All progress will be lost!")) {
                    handleTriggerGameOver("Out of Fuel! Journey ended at the market.");
                  }
                }}
                className="w-full h-11 btn-3d btn-red opacity-60 hover:opacity-100 !text-[11px]"
              >
                End Journey (Surrender)
              </button>
            </div>
          </div>
        )}

        {gameState === "gameover" && (
          <GameOverModal
            score={scoreBreakdown ? scoreBreakdown.finalScore : score}
            island={currentLevel}
            reason={gameOverReason ?? undefined}
            onRetry={() => {
              setLocation("/levels");
            }}
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
        {isPaused && !curseCard && !regionCardStartLevel && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300 px-8">
            <div className="bg-white rounded-[32px] w-full max-w-xs p-8 shadow-2xl flex flex-col gap-4 border-4 border-white items-center">
              <div className="text-center mb-4">
                <div className="text-slate-500 text-xs uppercase font-black tracking-widest leading-none mb-1">
                  {currentLevel === 1 ? "Tutorial" : `Level ${currentLevel - 1}`}
                </div>
                <h2 className="text-2xl font-display font-bold text-blue-600 leading-none mb-3">
                  {currentLevel === 1 ? "Training Bay" : (LEVEL_NAMES[currentLevel] ?? "Deep Voyage")}
                </h2>
                <div className="flex items-center justify-center gap-1.5 bg-yellow-50 px-4 py-2 rounded-2xl border border-yellow-100">
                   <img src="/assets/environment/gold_doubloon.png" alt="Gold" className="w-5 h-5 object-contain" />
                   <span className="text-xl font-bold text-yellow-700">{score}</span>
                </div>
                {/* Pass Card Counter in Pause Menu */}
                <div className="mt-3 flex items-center justify-center gap-1.5 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setShowPassCardPurchase(true)}>
                   <img src="/assets/pass_card.png" alt="Pass" className="w-5 h-6 object-contain" />
                   <span className="text-xl font-bold text-blue-700">{passCards}</span>
                   <div className="ml-1 bg-blue-600 text-white rounded-full p-0.5">
                     <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                   </div>
                </div>
              </div>

              <Button
                onClick={togglePause}
                className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                Resume
              </Button>

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="py-4 text-xs font-bold border-2 border-slate-100 text-slate-600 hover:bg-slate-50 rounded-2xl flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </Button>

                <Link href="/">
                  <Button
                    variant="outline"
                    className="w-full py-4 text-xs font-bold border-2 border-slate-100 text-slate-600 hover:bg-slate-50 rounded-2xl flex items-center justify-center gap-2"
                  >
                    <HomeIcon className="w-4 h-4" />
                    Menu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {curseCard && (
          <CursedLevelCard
            curse={curseCard}
            onClose={() => {
              setCurseCard(null);
              if (engineRef.current) {
                engineRef.current.resume();
                setIsPaused(false);
              }
            }}
          />
        )}

        {regionCardStartLevel && (
          <RegionIntroCard
            startLevel={regionCardStartLevel}
            onClose={() => {
              setRegionCardStartLevel(null);
              const pendingCurse = pendingCurseRef.current;
              pendingCurseRef.current = null;
              if (pendingCurse && !shownCurseLevelsRef.current.has(currentLevel)) {
                shownCurseLevelsRef.current.add(currentLevel);
                setCurseCard(pendingCurse);
                return;
              }
              if (engineRef.current) {
                engineRef.current.resume();
                setIsPaused(false);
              }
            }}
          />
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
            handleWatchAdReward();
            setShowFuelModal(false);
          }}
          onGetPassCard={() => {
            setShowFuelModal(false);
            setShowPassCardPurchase(true);
          }}
          onUsePassCard={() => {
            if (usePassCard()) {
              setPassCardsState(getPassCards());
              setUpgrades(prev => ({ ...prev, hasFuel: true }));
              setShowFuelModal(false);
            }
          }}
          onGiveUp={() => {
            setShowFuelModal(false);
            handleTriggerGameOver("Insufficient fuel to continue the journey.");
          }}
          fuelCost={fuelCost}
          passCards={passCards}
        />

        <InsufficientRepairModal
          isOpen={showRepairModal}
          onClose={() => setShowRepairModal(false)}
          onWatchAd={() => {
            handleWatchAdReward();
            setShowRepairModal(false);
          }}
          onGetDoubloons={() => {
            setShowRepairModal(false);
            setIsFuelShopOpened(true);
            setShowDoubloonShop(true);
          }}
          repairCost={repairCost}
        />

        <GoldDoubloonShopModal
          isOpen={showDoubloonShop}
          onClose={() => {
            setShowDoubloonShop(false);
            setIsFuelShopOpened(false);
            if (engineRef.current && isPaused) {
              engineRef.current.resume();
              setIsPaused(false);
            }
          }}
          isFuelShop={isFuelShopOpened}
          onPurchase={(doubloons, _price) => {
            if (isFuelShopOpened) {
              // Add to session score (run-specific coins)
              const newScore = score + doubloons;
              setScore(newScore);

              // Also sync with engine state if it exists
              if (engineRef.current) {
                engineRef.current.getState().score = newScore;
                engineRef.current.totalCoinsEarned += doubloons;
              }
            } else {
              // Add to permanent coins
              const current = getPermanentCoins();
              setPermanentCoins(current + doubloons);
            }
          }}
        />

        {showPassCardPurchase && (
          <PassCardPurchaseModal
            onClose={() => {
              setShowPassCardPurchase(false);
              if (gameState === "playing" && !showFuelModal && !showRepairModal) {
                if (engineRef.current && isPaused) {
                  engineRef.current.resume();
                  setIsPaused(false);
                }
              }
            }}
            onPurchase={(amount) => {
              addPassCards(amount);
              setPassCardsState(getPassCards());
              setShowPassCardPurchase(false);
              if (gameState === "playing" && !showFuelModal && !showRepairModal) {
                if (engineRef.current && isPaused) {
                  engineRef.current.resume();
                  setIsPaused(false);
                }
              }
            }}
          />
        )}

        {/* Back Link at bottom (only in playing) */}
        {!isPaused && gameState === "playing" && (
          <Link href="/" className="absolute bottom-6 left-6 z-30 p-3 bg-white/20 backdrop-blur rounded-full hover:bg-white/40 transition-colors">
            <ArrowLeft className="text-white w-6 h-6" />
          </Link>
        )}

        {showWelcomeGift && (
          <WelcomeGiftModal onClaim={handleClaimGift} />
        )}

        {showTutorialPassGift && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl flex flex-col items-center text-center gap-6 border-4 border-blue-100 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-32 h-44 relative animate-bounce-slow">
                <img src="/assets/pass_card.png" alt="Pass Card" className="w-full h-full object-contain drop-shadow-2xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
              </div>

              <div>
                <h2 className="text-3xl font-display font-black text-blue-600 drop-shadow-sm">Tutorial Gift!</h2>
                <p className="text-slate-500 font-bold mt-2">
                  Here is a free Pass Card to show you how it works!
                </p>
              </div>

              <Button
                onClick={() => {
                  addPassCards(1);
                  setPassCardsState(getPassCards());
                  setShowTutorialPassGift(false);
                  
                  // Automatically complete the 'pass' step and move to 'continue'
                  if (showMarketTutorial && marketTutorialStep === 'pass') {
                    setUpgrades(prev => ({ ...prev, hasFuel: true }));
                    setMarketTutorialStep('continue');
                  }
                }}
                className="w-full py-8 text-xl font-display font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-3xl shadow-xl border-b-8 border-blue-800 active:translate-y-1 active:border-b-4 transition-all"
              >
                CLAIM!
              </Button>
            </div>
            <style>{`
              @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
              .animate-shimmer { animation: shimmer 3s infinite; }
              @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
              .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
            `}</style>
          </div>
        )}

        {showMarketTutorial && (
          <MarketTutorialOverlay step={marketTutorialStep} />
        )}

        {discoveryCard && (
          <InfoCard
            entityKey={discoveryCard}
            onClose={() => {
              setDiscoveryCard(null);
              if (engineRef.current) {
                engineRef.current.resume();
                setIsPaused(false);
              }
            }}
          />
        )}
      </div>
      {/* Game Over Fade Overlay */}
      <div
        className="fixed inset-0 bg-black pointer-events-none z-[99999] transition-opacity duration-1000"
        style={{ opacity: isGameOverFading ? 1 : 0 }}
      />
    </div>
  );
}
