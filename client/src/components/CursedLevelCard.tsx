import React from "react";
import { X, Skull, AlertTriangle } from "lucide-react";
import { type CurseType } from "@/game/types";

const CURSE_DETAILS: Record<CurseType, { title: string; stats: Array<{ label: string; value: string }>; story: string }> = {
  none: {
    title: "No Curse",
    stats: [],
    story: "The sea feels normal for now. The wind is steady and the water is calm. It is a quiet moment between storms. Enjoy it while it lasts."
  },
  heavy_waters: {
    title: "Heavy Waters",
    stats: [{ label: "Weight", value: "All fish weight x1.5" }],
    story: "The ocean thickens as if it were molasses. Every catch drags harder against the hull and your storage fills faster than usual. Old sailors say these waters are weighted by forgotten treasure. Steady hands and light hauls are the only way through."
  },
  fast_current: {
    title: "Fast Current",
    stats: [{ label: "Speed", value: "All fish speed x1.5" }],
    story: "A sharp current slices through the sea and everything moves with it. Fish streak past the hook with barely a shadow. Nets feel lighter, but the hunt is far more frantic. It is a level that rewards quick reactions and clean casts."
  },
  blind_spot: {
    title: "Blind Spot",
    stats: [{ label: "Visibility", value: "Top 40% of water obscured" }],
    story: "A cold fog drifts across the surface and swallows the upper sea. What was once clear is now a silhouette. You can feel the fish above, but you cannot see them. The ocean tests your instincts more than your eyes."
  },
  reverse_current: {
    title: "Reverse Current",
    stats: [{ label: "Direction", value: "30% of fish move right" }],
    story: "The current curls back on itself, confusing every shoal. Some fish now flee the hook by rushing toward open water. The sea feels like a maze of shifting doors. Trust only what you track with patience."
  },
  double_damage: {
    title: "Double Damage",
    stats: [{ label: "Coral", value: "Coral hits cost 2 attempts" }],
    story: "The reef turns hostile and every mistake cuts twice as deep. Hooks crack and lines strain under the pressure. Veterans treat this curse like a duel with the seabed. Precision becomes your greatest shield."
  },
  economic_crisis: {
    title: "Economic Crisis",
    stats: [{ label: "Value", value: "All fish value -30%" }],
    story: "Markets dry up across the coast and prices plunge. Even rare catches feel ordinary in the ledger. The voyage becomes a test of volume, not prestige. Only the clever turn scarcity into profit."
  },
  countdown: {
    title: "Countdown",
    stats: [{ label: "Capacity", value: "Storage -5 every 10s" }],
    story: "Your hold begins to leak as if time itself is corroding it. Every ten seconds the space shrinks and choices become sharper. The ocean whispers to hurry, yet panic only speeds the loss. Fish smart, sell fast, and move on."
  },
  skeleton_army: {
    title: "Skeleton Army",
    stats: [{ label: "Spawn", value: "Skeleton spawn chance 80%" }],
    story: "Bones rise from the deep like a marching tide. The water fills with pale shapes that sap your haul. Each skeleton is a reminder of what the sea took before. The smart keep their distance and their balance."
  },
  fish_escape: {
    title: "Fish Escape",
    stats: [{ label: "Escape", value: "30% catch escape chance" }],
    story: "The fish are skittish tonight, slipping free at the last second. Lines go slack and empty hooks return in silence. Legends say the sea is warning you to slow down. Patience is the only cure for a fleeing school."
  },
  time_bomb: {
    title: "Time Bomb",
    stats: [{ label: "Inventory", value: "Random item removed every 8s" }],
    story: "Your cargo becomes unstable, vanishing as if snatched by unseen hands. Every eight seconds something is lost to the deep. It feels like sailing through a storm of thieves. Catch with urgency and keep your hold lean."
  },
  dark_matter: {
    title: "Dark Matter",
    stats: [{ label: "Obstacles", value: "Obstacles become invisible" }],
    story: "The seabed is cloaked in shadow and the world feels incomplete. You can sense the reefs but cannot see them. Every cast risks a sudden stop. The ocean demands memory and caution in equal measure."
  },
  chain_reaction: {
    title: "Chain Reaction",
    stats: [{ label: "Chain", value: "Caught fish pulls nearby fish" }],
    story: "When one fish rises, others follow as if bound by fate. The water stirs with sudden, linked motion. It can be a blessing or a burden depending on what you pull. Choose your target wisely and the sea will answer."
  },
  invisible_fish: {
    title: "Invisible Fish",
    stats: [{ label: "Visibility", value: "Fish are invisible" }],
    story: "The sea is full of ghosts. You can hear splashes and feel the current shift, but the fish themselves are unseen. Hooks must follow instinct and timing instead of sight. It is a silent test of rhythm and nerve."
  },
  reverse_market: {
    title: "Reverse Market",
    stats: [{ label: "Prices", value: "Sell -50%, Buy +50%" }],
    story: "Merchants flip their ledgers and your profits shrink. Goods cost more, and sales barely cover the trip. The sea feels harsher when every coin is worth less. Only the bold profit in a flipped economy."
  },
  random_loop: {
    title: "Random Loop",
    stats: [{ label: "Swing", value: "Hook swing speed changes constantly" }],
    story: "The line wobbles as if caught in restless winds. The hook’s rhythm never stays the same for long. Every cast is a new puzzle to solve. Flexibility wins over habit in these shifting currents."
  },
  reverse_weight: {
    title: "Reverse Weight",
    stats: [{ label: "Gauge", value: "Weight meter reversed" }],
    story: "The scales lie and the hold feels lighter than it is. What looks safe can still sink you. Captains whisper of cursed compasses and reversed tides. Trust your memory, not the gauge."
  },
  random_curse: {
    title: "Random Curse",
    stats: [{ label: "Cycle", value: "Curse changes every 15s" }],
    story: "The ocean refuses to keep a single rule. Every fifteen seconds a new danger rises and the old one fades. You must adapt faster than the tide itself. Survive by reading the sea’s sudden moods."
  },
  combo_1: {
    title: "Combo I: Heavy Waters + Fast Current",
    stats: [
      { label: "Weight", value: "All fish weight x1.5" },
      { label: "Speed", value: "All fish speed x1.5" }
    ],
    story: "The sea grows heavy while the fish grow faster, a cruel mismatch. Each catch is harder to secure and harder to keep. The water tests strength and timing at once. Only a perfect rhythm will carry you through."
  },
  combo_2: {
    title: "Combo II: Economic Crisis + Double Damage",
    stats: [
      { label: "Value", value: "All fish value -30%" },
      { label: "Coral", value: "Coral hits cost 2 attempts" }
    ],
    story: "Profits fall while the reef grows sharper. Every mistake now costs twice as much in time and value. The sea dares you to keep fishing anyway. Careful navigation is the only way to earn back what is lost."
  },
  combo_3: {
    title: "Combo III: Heavy + Fast + Economic",
    stats: [
      { label: "Weight", value: "All fish weight x1.5" },
      { label: "Speed", value: "All fish speed x1.5" },
      { label: "Value", value: "All fish value -30%" }
    ],
    story: "This is a storm of every hardship at once. Fish are heavier, faster, and worth less than before. The sea demands courage more than profit. Survive the level and you earn a story worth telling."
  },
  final_1: {
    title: "Final I: Invisible Fish + Skeleton Army + Double Damage",
    stats: [
      { label: "Visibility", value: "Fish invisible" },
      { label: "Spawn", value: "Skeleton spawn chance 80%" },
      { label: "Coral", value: "Coral hits cost 2 attempts" }
    ],
    story: "The abyss hides its prey and fills the water with bones. You must hook what you cannot see while avoiding what you cannot afford to hit. Every cast feels like a gamble against the deep. This is the ocean at its most unforgiving."
  },
  final_2: {
    title: "Final II: Countdown + Chain Reaction + Fast Current",
    stats: [
      { label: "Capacity", value: "Storage -5 every 10s" },
      { label: "Chain", value: "Caught fish pulls nearby fish" },
      { label: "Speed", value: "All fish speed x1.5" }
    ],
    story: "Time compresses and the sea races forward. Your hold shrinks while the fish surge faster than ever. The chain effect can save you or bury you under weight. Choose fast, sell faster, and trust your instincts."
  },
  final_3: {
    title: "Final III: Reverse Market + Fish Escape",
    stats: [
      { label: "Prices", value: "Sell -50%, Buy +50%" },
      { label: "Escape", value: "30% catch escape chance" }
    ],
    story: "The market turns against you and the fish refuse to stay. Every haul feels like it vanishes in your hands. It is a test of persistence more than luck. Push forward and claim your place among the legends."
  },
  one_chance: {
    title: "One Chance",
    stats: [{ label: "Attempts", value: "Single cast only" }],
    story: "A single cast decides the outcome of the voyage. There is no second chance, no backup line. The sea watches and waits for your move. Choose your moment and let it define the run."
  }
};

interface CursedLevelCardProps {
  curse: CurseType;
  onClose: () => void;
}

export const CursedLevelCard: React.FC<CursedLevelCardProps> = ({ curse, onClose }) => {
  const details = CURSE_DETAILS[curse];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-[36px] shadow-2xl p-8 border-4 border-white overflow-y-auto max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
            <Skull className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-500 uppercase tracking-wider">Cursed Level</div>
            <h2 className="text-2xl font-bold text-slate-900">{details.title}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {details.stats.map(stat => (
            <div key={stat.label} className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600">
              <div className="text-[10px] uppercase text-red-400 font-bold tracking-wide">{stat.label}</div>
              <div className="text-slate-700">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertTriangle size={14} />
            Story
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            {details.story}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Start Level
        </button>
      </div>
    </div>
  );
};
