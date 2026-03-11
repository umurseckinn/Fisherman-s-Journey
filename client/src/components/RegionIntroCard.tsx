import React from "react";
import { X, Map, Waves } from "lucide-react";

const REGION_INTROS: Record<number, { title: string; range: string; story: string }> = {
  1: {
    title: "Training Bay",
    range: "Tutorial",
    story: "Welcome to the Training Bay! Here you will learn the ropes of being a master fisherman. Master the use of Harpoons, TNT, Nets, and the mystical Anchor. This short voyage is designed to prepare you for the real challenges ahead in Dawnbreak Cove and beyond. Complete this ritual once, and your true journey begins."
  },
  2: {
    title: "Dawnbreak Cove",
    range: "L1-L19",
    story: "This is where every sailor takes their first breath, where saltwater first mixes with their blood. Beneath its calm exterior lie treacherous currents and ancient shipwrecks waiting for novices. As the first light of dawn hits the shallow waters, those who dream of becoming legends set their sails here for the very first time. Yet, only those who learn the rhythm of the waves can depart this safe haven in one piece."
  },
  21: {
    title: "The Whispering Atolls",
    range: "L20-L29",
    story: "Mesmerizing with their dazzling colors, these waters are actually one of nature's most ruthless battlegrounds. The massive coral labyrinths beneath the surface hide both unparalleled treasures and bloodthirsty sea creatures. At night, the phosphorescent glow emitted by the corals shines like the souls of lost sailors. Only those with sharp instincts can press on without heeding the whispers of these isles."
  },
  31: {
    title: "The Abyssal Blue",
    range: "L30-L39",
    story: "This is the boundary where light slowly fades, descending into the dark heart of the ocean. The water is so deep and ink-black that looking down feels like staring into a massive abyss. The familiar waves of the surface give way to silent, deadly whirlpools created by colossal sea monsters. Only those brave enough to face the darkness can unearth the secrets of this blue hell."
  },
  41: {
    title: "Tempest Strait",
    range: "L40-L59",
    story: "It is a cursed passage where the sky is forever black and the sea is eternally wrathful. As lightning batters the waters, colossal waves wait to crush even the sturdiest ships like nutshells. The winds here sound less like a storm and more like the shrieks of furious sea spirits. Surviving this strait is not a matter of luck, but an absolute victory won against the fury of nature."
  },
  61: {
    title: "The Infinite Maelstrom",
    range: "L60-L79",
    story: "This is a mystical realm where time and direction sink to the bottom of the ocean, and reality itself warps. Massive, never-ending currents drag ships into an endless spiral. In these waters where compasses go mad, an island you saw yesterday might completely vanish tomorrow. To break this cycle, you must conquer not the sea, but your own mind."
  },
  81: {
    title: "The Paragon's Run",
    range: "L80-L99",
    story: "Situated at the edge of the world, this is the final trial accessible only to those who will write their names in history with letters of gold. These waters are patrolled by the legendary guardians of the ocean incarnate. Every single mile is an epic battle for survival. Those who complete this run are no longer mere sailors, but living legends of the ocean."
  }
};

interface RegionIntroCardProps {
  startLevel: number;
  onClose: () => void;
}

export const RegionIntroCard: React.FC<RegionIntroCardProps> = ({ startLevel, onClose }) => {
  const details = REGION_INTROS[startLevel];
  if (!details) return null;
  const backgroundUrl = `/assets/episodes/${encodeURIComponent(details.title)}.png`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-[36px] shadow-2xl border-4 border-white overflow-hidden max-h-[85vh]"
        style={{ backgroundImage: `url("${backgroundUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 p-8 overflow-y-auto max-h-[85vh]">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/85 flex items-center justify-center">
              <Map className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">{startLevel === 1 ? "Tutorial" : "New Region"}</div>
              <h2 className="text-2xl font-bold text-white drop-shadow">{details.title}</h2>
              <div className="text-sm font-semibold text-white/80">{details.range}</div>
            </div>
          </div>

          <div className="p-4 bg-black/35 rounded-2xl border border-white/25 mb-6">
            <div className="flex items-center gap-2 text-white/90 font-bold text-xs uppercase tracking-wider mb-2">
              <Waves size={14} />
              Story
            </div>
            <p className="text-white font-medium leading-relaxed">
              {details.story}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-amber-400 text-slate-900 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Region
          </button>
        </div>
      </div>
    </div>
  );
};
