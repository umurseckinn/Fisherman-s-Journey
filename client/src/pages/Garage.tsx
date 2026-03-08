import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Check, Info, X, Home as HomeIcon } from "lucide-react";
import {
  VEHICLES,
  getEffectiveStats,
  type VehicleData,
} from "@/game/vehicles";
import {
  getPermanentCoins,
  setPermanentCoins,
  getActiveVehicleId,
  setActiveVehicleId,
  isVehicleOwned,
  buyVehicle,
  isStoOwned,
  buySto,
  isRodOwned,
  buyRod,
  getStoFlags,
  getRodFlags,
} from "@/game/storage";
import { GoldDoubloonShopModal } from "@/components/GoldDoubloonShopModal";

interface GarageProps {
  onStartFishing: (vehicleId: string) => void;
}

export default function Garage({ onStartFishing }: GarageProps) {
  const [vehicleIdx, setVehicleIdx] = useState(() => {
    const id = getActiveVehicleId();
    const idx = VEHICLES.findIndex(v => v.id === id);
    return idx >= 0 ? idx : 0;
  });
  const [pCoins, setPCoins] = useState(getPermanentCoins);
  const [showHowToEarn, setShowHowToEarn] = useState(false);
  const [animatingCoin, setAnimatingCoin] = useState(false);
  const [upgradeFlash, setUpgradeFlash] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [showIap, setShowIap] = useState(false);
  const [iapTitle, setIapTitle] = useState('');
  const coinDisplayRef = useRef(pCoins);
  const animFrameRef = useRef<number | null>(null);
  const bubblesRef = useRef<Array<{ id: number; x: number; y: number; size: number; speed: number; opacity: number }>>([]);
  const bubblesCanvasRef = useRef<HTMLCanvasElement>(null);
  const pendingPurchaseRef = useRef<null | (() => void)>(null);

  const vehicle = VEHICLES[vehicleIdx];

  // Refresh coins from storage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = getPermanentCoins();
      if (stored !== coinDisplayRef.current) {
        if (stored > coinDisplayRef.current) {
          setAnimatingCoin(true);
          setTimeout(() => setAnimatingCoin(false), 400);
        }
        coinDisplayRef.current = stored;
        setPCoins(stored);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Persist active vehicle
  useEffect(() => {
    setActiveVehicleId(vehicle.id);
  }, [vehicle.id]);

  // Ambient bubbles animation
  useEffect(() => {
    const canvas = bubblesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Init bubbles
    bubblesRef.current = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 400,
      y: Math.random() * 700 + 700,
      size: 2 + Math.random() * 3,
      speed: 0.15 + Math.random() * 0.3,
      opacity: 0.1 + Math.random() * 0.25,
    }));

    let running = true;
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bubblesRef.current.forEach(b => {
        b.y -= b.speed;
        if (b.y < -10) {
          b.y = canvas.height + 10;
          b.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,200,255,${b.opacity})`;
        ctx.fill();
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const ownedSto = getStoFlags(vehicle.id);
  const ownedRod = getRodFlags(vehicle.id);
  const owned = isVehicleOwned(vehicle.id);
  const stats = getEffectiveStats(vehicle, ownedSto.map(Number), ownedRod.map(Number));

  // Max stat values for bar percentages
  const MAX_STORAGE = 618;
  const MAX_SWING = 0.028;
  const MAX_DEPTH = 97;
  const MAX_ATTEMPTS = 5;

  const navigate = (dir: 'left' | 'right') => {
    const next = dir === 'right'
      ? (vehicleIdx + 1) % VEHICLES.length
      : (vehicleIdx - 1 + VEHICLES.length) % VEHICLES.length;
    setSlideDir(dir);
    setIsSliding(true);
    setTimeout(() => {
      setVehicleIdx(next);
      setIsSliding(false);
      setSlideDir(null);
    }, 180);
  };

  const handleBuySto = (levelIdx: number) => {
    const upg = vehicle.storageUpgrades[levelIdx];
    if (!upg) return;
    const n = (levelIdx + 1) as 1 | 2 | 3 | 4 | 5;
    if (isStoOwned(vehicle.id, n)) return;
    buySto(vehicle.id, n);
    setUpgradeFlash(`sto_${n}`);
    setTimeout(() => setUpgradeFlash(null), 600);
  };

  const handleBuyRod = (levelIdx: number) => {
    const upg = vehicle.rodUpgrades[levelIdx];
    if (!upg) return;
    const n = (levelIdx + 1) as 1 | 2 | 3 | 4 | 5;
    if (isRodOwned(vehicle.id, n)) return;
    buyRod(vehicle.id, n);
    setUpgradeFlash(`rod_${n}`);
    setTimeout(() => setUpgradeFlash(null), 600);
  };

  const handleBuyVehicle = () => {
    if (owned) return;
    buyVehicle(vehicle.id);
    setUpgradeFlash('vehicle');
    setTimeout(() => setUpgradeFlash(null), 800);
  };

  const handleStart = () => {
    if (!owned) return;
    onStartFishing(vehicle.id);
  };

  const formatCoins = (n: number) => n.toLocaleString();
  const nextStoIndex = vehicle.storageUpgrades.findIndex((_, i) => !isStoOwned(vehicle.id, (i + 1) as 1 | 2 | 3 | 4 | 5));
  const nextRodIndex = vehicle.rodUpgrades.findIndex((_, i) => !isRodOwned(vehicle.id, (i + 1) as 1 | 2 | 3 | 4 | 5));
  const nextStoLevel = nextStoIndex >= 0 ? nextStoIndex + 1 : null;
  const nextRodLevel = nextRodIndex >= 0 ? nextRodIndex + 1 : null;
  const nextStoUpgrade = nextStoIndex >= 0 ? vehicle.storageUpgrades[nextStoIndex] : null;
  const nextRodUpgrade = nextRodIndex >= 0 ? vehicle.rodUpgrades[nextRodIndex] : null;

  const attemptPurchase = (cost: number, action: () => void, title: string) => {
    if (pCoins >= cost) {
      const newCoins = pCoins - cost;
      setPermanentCoins(newCoins);
      setPCoins(newCoins);
      action();
      return;
    }
    pendingPurchaseRef.current = action;
    setIapTitle(title);
    setShowIap(true);
  };

  return (
    <div
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0D1B4B 0%, #001A33 100%)' }}
    >
      {/* Bubbles canvas */}
      <canvas
        ref={bubblesCanvasRef}
        width={400}
        height={800}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Caustic overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 70%, rgba(0,188,212,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(0,150,200,0.04) 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full h-full max-w-[450px] max-h-[800px] overflow-y-auto flex flex-col z-10">

        {/* ── Top bar: permanent coins ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 rounded-xl bg-[#0A2540]/60 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-900/30 transition-colors">
                <HomeIcon className="w-5 h-5" />
              </button>
            </Link>
            <div className={`flex items-center gap-2 bg-[#0A2540]/80 border border-[rgba(100,200,255,0.25)] rounded-2xl px-4 py-2 transition-transform ${animatingCoin ? 'scale-125' : 'scale-100'}`} style={{ transition: 'transform 0.2s' }}>
              <img src="/assets/environment/gold_doubloon.png" alt="Gold Doubloon" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.7))' }} />
              <span className="text-white font-bold text-base">{formatCoins(pCoins)}</span>
            </div>
          </div>
          <button
            onClick={() => setShowHowToEarn(v => !v)}
            className="flex items-center gap-1 text-cyan-300 text-xs font-semibold bg-[#0A2540]/60 border border-cyan-400/20 rounded-xl px-3 py-2 hover:bg-cyan-900/30 transition-colors"
          >
            <Info className="w-3.5 h-3.5" /> HOW TO EARN
          </button>
        </div>

        {/* How to earn tooltip */}
        {showHowToEarn && (
          <div className="mx-5 mb-2 bg-[#0A2540]/90 border border-cyan-400/30 rounded-2xl p-4 text-cyan-100 text-xs relative">
            <button onClick={() => setShowHowToEarn(false)} className="absolute top-2 right-2 text-cyan-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            <p className="font-bold mb-1 flex items-center gap-1">
              <img src="/assets/environment/gold_doubloon.png" alt="" className="w-4 h-4 object-contain inline" />
              Gold Doubloons
            </p>
            <p>Every coin you earn in a run is automatically saved as Gold Doubloons — even mid-run. They survive death, app close, everything. Spend them here in the Garage on vehicles and upgrades.</p>
          </div>
        )}

        {/* ── Vehicle selector ── */}
        <div className="flex items-center justify-between px-4 py-1">
          <button onClick={() => navigate('left')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <div className="text-white font-display text-xl tracking-wide leading-tight">{vehicle.name}</div>
            <div className="text-cyan-300 text-sm font-display tracking-wider">{vehicle.captain}</div>
          </div>
          <button onClick={() => navigate('right')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* ── Vehicle sprite card ── */}
        <div
          className="mx-4 mt-1 rounded-2xl flex flex-col items-center justify-center py-4 px-2"
          style={{ background: '#0A2540', border: '1px solid rgba(100,200,255,0.2)' }}
        >
          <div
            className={`transition-all duration-180 ${isSliding ? (slideDir === 'right' ? 'translate-x-8 opacity-0' : '-translate-x-8 opacity-0') : 'translate-x-0 opacity-100'}`}
            style={{ transition: 'all 0.18s ease-out' }}
          >
            <BobbingSprite vehicleFile={vehicle.file} vehicleName={vehicle.name} />
          </div>
          <div className="text-white font-display text-base mt-1 tracking-wide">{vehicle.name}</div>
          <div className="text-cyan-300 text-sm font-display tracking-wider">{vehicle.captain}</div>
          {vehicle.base.special && (
            <div className="mt-1 text-yellow-300 text-[10px] bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/30">
              ⭐ {vehicle.base.special}
            </div>
          )}
        </div>

        {/* ── Stats panel ── */}
        <div className="mx-4 mt-3 bg-[#081c30]/60 rounded-2xl p-3 border border-white/5">
          <div className="text-cyan-200 font-bold text-xs mb-2 uppercase tracking-wide">Current Effective Stats</div>
          <StatBar label="Storage" value={`${stats.storage} kg`} pct={stats.storage / MAX_STORAGE} flash={upgradeFlash?.startsWith('sto')} />
          <StatBar label="Swing" value={stats.swingSpeed.toFixed(3)} pct={stats.swingSpeed / MAX_SWING} flash={upgradeFlash?.startsWith('rod')} />
          <StatBar label="Depth" value={`${stats.hookDepth.toFixed(0)}%`} pct={stats.hookDepth / MAX_DEPTH} flash={upgradeFlash?.startsWith('rod')} />
          <StatBar label="Casts" value={`${stats.castAttempts}`} pct={stats.castAttempts / MAX_ATTEMPTS} flash={upgradeFlash?.startsWith('rod')} />
          <StatBar label="Coral" value={`${stats.coralProtection.toFixed(0)}%`} pct={stats.coralProtection / 100} flash={upgradeFlash?.startsWith('rod')} />
        </div>

        {/* ── Upgrade buttons ── */}
        <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (nextStoIndex < 0 || !nextStoUpgrade) return;
              attemptPurchase(nextStoUpgrade.cost, () => handleBuySto(nextStoIndex), `Storage Lv${nextStoLevel}`);
            }}
            disabled={nextStoIndex < 0}
            className={`rounded-xl px-3 py-3 text-left border transition-all ${nextStoIndex >= 0
              ? 'bg-blue-700/30 border-blue-500/40 hover:bg-blue-600/40 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-green-800/20 border-green-600/30 text-green-300'
              }`}
          >
            <div className="text-white text-sm font-bold">{nextStoLevel ? `Storage Lv${nextStoLevel}` : 'Storage MAX'}</div>
            <div className="text-xs text-cyan-200 mt-1 flex items-center gap-1">{nextStoLevel && nextStoUpgrade ? <><img src="/assets/environment/gold_doubloon.png" alt="" className="w-3.5 h-3.5 object-contain inline" />{formatCoins(nextStoUpgrade.cost)}</> : 'Owned'}</div>
          </button>
          <button
            onClick={() => {
              if (nextRodIndex < 0 || !nextRodUpgrade) return;
              attemptPurchase(nextRodUpgrade.cost, () => handleBuyRod(nextRodIndex), `Rod Lv${nextRodLevel}`);
            }}
            disabled={nextRodIndex < 0}
            className={`rounded-xl px-3 py-3 text-left border transition-all ${nextRodIndex >= 0
              ? 'bg-purple-700/30 border-purple-500/40 hover:bg-purple-600/40 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-green-800/20 border-green-600/30 text-green-300'
              }`}
          >
            <div className="text-white text-sm font-bold">{nextRodLevel ? `Rod Lv${nextRodLevel}` : 'Rod MAX'}</div>
            <div className="text-xs text-cyan-200 mt-1 flex items-center gap-1">{nextRodLevel && nextRodUpgrade ? <><img src="/assets/environment/gold_doubloon.png" alt="" className="w-3.5 h-3.5 object-contain inline" />{formatCoins(nextRodUpgrade.cost)}</> : 'Owned'}</div>
          </button>
        </div>

        {/* ── Vehicle status button ── */}
        <div className="mx-4 mt-3">
          <VehicleStatusButton
            vehicle={vehicle}
            owned={owned}
            flash={upgradeFlash === 'vehicle'}
            onBuy={() => attemptPurchase(vehicle.unlockCost, handleBuyVehicle, vehicle.name)}
            costLabel={`${formatCoins(vehicle.unlockCost)}`}
            showDoubloonIcon={true}
          />
        </div>

        {/* ── Start Fishing button ── */}
        <div className="mx-4 mt-3 mb-6">
          <button
            disabled={!owned}
            onClick={handleStart}
            className={`w-full rounded-full py-5 text-xl font-bold tracking-wide transition-all ${owned
              ? 'bg-gradient-to-r from-teal-500 to-cyan-400 text-white shadow-lg shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] animate-start-glow'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-60'
              }`}
          >
            START FISHING →
          </button>
        </div>
      </div>

      <GoldDoubloonShopModal
        isOpen={showIap}
        onClose={() => setShowIap(false)}
        onPurchase={(doubloons, _price) => {
          // Add purchased doubloons to permanent coins
          const current = getPermanentCoins();
          setPermanentCoins(current + doubloons);
          setPCoins(current + doubloons);
          setShowIap(false);
          // Run pending purchase if any
          if (pendingPurchaseRef.current) {
            setTimeout(() => {
              if (pendingPurchaseRef.current) pendingPurchaseRef.current();
            }, 300);
          }
        }}
      />

      <style>{`
        @keyframes startGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(0,188,212,0.4), 0 0 24px rgba(0,188,212,0.2); transform: scale(1); }
          50% { box-shadow: 0 0 20px rgba(0,188,212,0.7), 0 0 40px rgba(0,188,212,0.35); transform: scale(1.02); }
        }
        .animate-start-glow { animation: startGlow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BobbingSprite({ vehicleFile, vehicleName }: { vehicleFile: string; vehicleName: string }) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.04;
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${Math.sin(t) * 3}px)`;
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <img
      ref={imgRef}
      src={`/assets/fisherman_and_boat/${vehicleFile}`}
      alt={vehicleName}
      className="max-h-[140px] max-w-[280px] object-contain"
      style={{ imageRendering: 'auto' }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

function StatBar({ label, value, pct, flash }: { label: string; value: string; pct: number; flash?: boolean }) {
  const filled = Math.max(0, Math.min(1, pct));
  return (
    <div className={`flex items-center gap-2 mb-1.5 transition-all ${flash ? 'scale-105' : ''}`} style={{ transition: 'all 0.3s ease-out' }}>
      <span className="text-cyan-200 text-[11px] w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${filled * 100}%`,
            background: 'linear-gradient(90deg, #00BCD4, #00E5FF)',
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>
      <span className="text-white text-[11px] w-16 text-right shrink-0">{value}</span>
    </div>
  );
}

function VehicleStatusButton({
  vehicle,
  owned,
  flash,
  onBuy,
  costLabel,
  showDoubloonIcon,
}: {
  vehicle: VehicleData;
  owned: boolean;
  flash: boolean;
  onBuy: () => void;
  costLabel: string;
  showDoubloonIcon?: boolean;
}) {
  if (owned) {
    return (
      <div className={`w-full rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm ${flash ? 'bg-green-500 text-white' : 'bg-green-800/30 border border-green-500/40 text-green-400'}`}>
        <Check className="w-5 h-5" /> ACTIVE
      </div>
    );
  }
  return (
    <button
      onClick={onBuy}
      className={`w-full rounded-xl py-3 flex items-center justify-center gap-2 font-bold text-sm transition-all ${'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-md'
        }`}
    >
      {showDoubloonIcon && (
        <img src="/assets/environment/gold_doubloon.png" alt="" className="w-4 h-4 object-contain" style={{ filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.8))' }} />
      )}
      {costLabel} — BUY
    </button>
  );
}
