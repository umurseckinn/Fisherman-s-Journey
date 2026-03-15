import { motion } from "framer-motion";
import { RefreshCcw, Home, Trophy, Play } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";
import { type RunScoreBreakdown } from "@/game/storage";
import { t } from "@/lib/i18n";
import { AutoShrinkText } from "@/components/ui/AutoShrinkText";

interface GameOverModalProps {
  score: number;
  island: number;
  reason?: string;
  onRetry: () => void;
  scoreBreakdown?: RunScoreBreakdown;
}

export function GameOverModal({ score, island, reason, onRetry, scoreBreakdown }: GameOverModalProps) {
  const theme = useMemo(() => {
    const r = reason?.toLowerCase() || "";
    if (r.includes("unusable") || r.includes("broken")) {
      return {
        type: 'ROD_BROKEN',
        title: t('ui.rod_broken_title', "Oh snap! Rod Broken!"),
        image: "/assets/game_over/ROD_BROKEN.png",
        color: "from-orange-400 to-red-600",
        btn: "bg-orange-500 hover:bg-orange-600 shadow-orange-900/50",
        scale: 1.5,
        rotate: 90
      };
    }
    if (r.includes("sank") || r.includes("heavy load")) {
      return {
        type: 'STORAGE_FULL_SUNK',
        title: t('ui.boat_sunk_title', "Overweight! Boat Sunk!"),
        image: "/assets/game_over/STORAGE_FULL_SUNK.png",
        color: "from-cyan-400 to-blue-600",
        btn: "bg-cyan-500 hover:bg-cyan-600 shadow-cyan-900/50",
        scale: 1.9,
        rotate: 0
      };
    }
    if (r.includes("fuel")) {
      return {
        type: 'OUT_OF_FUEL',
        title: t('ui.out_of_fuel_title', "Stranded! Out of Fuel!"),
        image: "/assets/game_over/OUT_OF_FUEL.png",
        color: "from-red-400 to-yellow-600",
        btn: "bg-red-500 hover:bg-red-600 shadow-red-900/50",
        scale: 1.8,
        rotate: 0
      };
    }
    return {
      type: 'DEFAULT',
      title: t('common.game_over', "Game Over"),
      image: "/assets/game_over/ROD_BROKEN.png",
      color: "from-slate-400 to-slate-600",
      btn: "bg-primary hover:bg-primary/90 shadow-slate-900/50",
      scale: 1.0,
      rotate: 0
    };
  }, [reason]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[500] flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-950 rounded-[40px] w-full max-w-sm relative shadow-2xl border-8 border-slate-900 flex flex-col pt-12 pb-8 px-6 overflow-hidden"
      >
        {/* Header Image Container */}
        <div className="w-full h-44 mb-2 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] flex items-center justify-center relative">
          <img
            src={theme.image}
            alt={theme.type}
            className="h-full object-contain animate-bounce-slow"
            style={{
              transform: `rotate(${theme.rotate}deg) scale(${theme.scale})`,
              filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Dynamic Title */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-black italic tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-gradient-to-b ${theme.color} bg-clip-text text-transparent uppercase`}>
            <AutoShrinkText maxFontSize={24}>{theme.title}</AutoShrinkText>
          </h2>
          <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest mt-1">
            {t('ui.island_reached', 'Island {island} Reached', { island })}
          </p>
        </div>

        {/* Score Board (Dark Mode) */}
        <div className="bg-slate-900/50 rounded-[32px] p-5 mb-8 border border-white/5 inner-shadow relative">
          {scoreBreakdown?.isNewRecord && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-300 to-amber-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg border-2 border-slate-950 z-20"
            >
              {t('ui.new_record', 'NEW RECORD!')}
            </motion.div>
          )}

          <div className="text-center mb-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('ui.total_score', 'TOTAL SCORE')}</div>
            <div className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">
              {score.toLocaleString()}
            </div>
          </div>

          <div className="space-y-2 border-t border-white/5 pt-4 px-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
              <span>{t('ui.base_score', 'Base Score')}</span>
              <span className="text-slate-200">{scoreBreakdown?.baseScore.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black text-blue-400 uppercase">
              <span>{t('ui.depth_bonus', 'Depth Bonus')}</span>
              <span>+{scoreBreakdown?.depthBonus.toLocaleString() || 0}</span>
            </div>
            {(scoreBreakdown?.kingBonus || 0) > 0 && (
              <div className="flex justify-between items-center text-[10px] font-black text-amber-500 uppercase">
                <span>{t('ui.king_bounty', 'King Bounty')}</span>
                <span>+{scoreBreakdown?.kingBonus.toLocaleString() || 0}</span>
              </div>
            )}

            {/* Vault Translation (Dark) */}
            <div className="mt-4 bg-slate-900 rounded-2xl p-3 border border-white/5 flex items-center justify-between shadow-inner">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1">{t('ui.vault_earnings', 'Vault Earnings')}</span>
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-lg font-black text-amber-500">+{scoreBreakdown?.finalScore.toLocaleString() || score.toLocaleString()}</span>
                  <img src="/assets/environment/gold_doubloon.png" alt="🪙" className="w-4 h-4 object-contain" />
                </div>
              </div>
              <Play className="w-5 h-5 text-amber-500/30 fill-current" />
            </div>
          </div>
        </div>

        {/* Action Buttons (Dark) */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/">
            <button className="w-full py-4 rounded-[24px] font-black text-[12px] text-slate-400 bg-slate-900 border-b-4 border-black active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
              <Home className="w-4 h-4 text-slate-500" />
              {t('ui.menu', 'MENU')}
            </button>
          </Link>

          <button
            onClick={onRetry}
            className={`w-full py-4 rounded-[24px] font-black text-[12px] text-white shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 ${theme.btn}`}
          >
            <RefreshCcw className="w-4 h-4" />
            {t('ui.retry', 'RETRY')}
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .inner-shadow {
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
