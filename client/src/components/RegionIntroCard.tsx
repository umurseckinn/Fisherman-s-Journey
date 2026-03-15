import React from "react";
import { X, Map, Waves } from "lucide-react";
import { t } from "@/lib/i18n";
import { AutoShrinkText } from "@/components/ui/AutoShrinkText";

const REGION_INTROS: Record<number, { title: string; range: string; story: string; image: string; key: string }> = {
  2: {
    title: t('region_intros.r1.title', "Dawnbreak Cove"),
    range: "L1 - L10",
    story: t('region_intros.r1.story', "This is where every sailor takes their first breath. Beneath its calm exterior lie ancient shipwrecks waiting for novices. As the first light of dawn hits the shallow waters, those who dream of becoming legends set their sails here for the very first time."),
    image: "Dawnbreak Cove.png",
    key: "r1"
  },
  11: {
    title: t('region_intros.r2.title', "Twilight Reef"),
    range: "L11 - L20",
    story: t('region_intros.r2.story', "The glowing corals illuminate the darkened waters, marking your arrival at the mysterious Twilight Reef. Whispers of forgotten sea-dwellers echo through the tides as you dive deeper into the beautiful but treacherous abyss. Now that you have mastered the shallows, the enchanted creatures here will test your growing combat skills. Equip your water-breathing gear and prepare to face the lurking shadows of the vibrant coral mazes. Click here to dive into the adventure and conquer the submerged secrets waiting between levels 11 and 20!"),
    image: "Twilight_Reef.png",
    key: "r2"
  },
  21: {
    title: t('region_intros.r3.title', "The Whispering Atolls"),
    range: "L21 - L30",
    story: t('region_intros.r3.story', "Mesmerizing with their dazzling colors, these waters are actually one of nature's most ruthless battlegrounds. The massive coral labyrinths beneath the surface hide both unparalleled treasures and bloodthirsty sea creatures. Only those with sharp instincts can press on."),
    image: "The Whispering Atolls.png",
    key: "r3"
  },
  31: {
    title: t('region_intros.r4.title', "The Abyssal Blue"),
    range: "L31 - L40",
    story: t('region_intros.r4.story', "This is the boundary where light slowly fades, descending into the dark heart of the ocean. The familiar waves of the surface give way to silent, deadly whirlpools. Only those brave enough to face the darkness can unearth the secrets of this blue hell."),
    image: "The Abyssal Blue.png",
    key: "r4"
  },
  41: {
    title: t('region_intros.r5.title', "Tempest Strait"),
    range: "L41 - L50",
    story: t('region_intros.r5.story', "It is a passage where the sky is forever black and the sea is eternally wrathful. Colossal waves wait to crush even the sturdiest ships. Surviving this strait is not a matter of luck, but an absolute victory won against the fury of nature."),
    image: "Tempest Strait.png",
    key: "r5"
  },
  51: {
    title: t('region_intros.r6.title', "Aurora Depths"),
    range: "L51 - L60",
    story: t('region_intros.r6.story', "A mystical realm illuminated by shimmering underwater lights that mimic the northern sky. The currents here move in strange, rhythmic patterns, and the silence is heavy with ancient magic. Watch the glow, for it guides the worthy."),
    image: "The Infinite Maelstrom.png",
    key: "r6"
  },
  61: {
    title: t('region_intros.r7.title', "Crimson Moon"),
    range: "L61 - L70",
    story: t('region_intros.r7.story', "A sinister red glow bathes the barren landscape, warning all who dare to step beneath the Crimson Moon. Vengeful spirits and nightmarish beasts roam these haunted lands, drawn by the scent of a seasoned warrior like you. Only those who have survived countless battles can hope to withstand the maddening corruption of this dark realm. Sharpen your finest weapons and brace your mind for the terrifying trials that lie ahead in the shadows. Step into the bloody moonlight today and prove your worth in the deadly challenges of levels 61 to 70!"),
    image: "Crimson_Moon.png",
    key: "r7"
  },
  71: {
    title: t('region_intros.r8.title', "Chaos Vortex"),
    range: "L71 - L80",
    story: t('region_intros.r8.story', "This is a mystical realm where time and direction sink to the bottom of the ocean. Massive, never-ending currents drag ships into an endless spiral. In these waters where compasses go mad, you must conquer not the sea, but your own mind."),
    image: "The Infinite Maelstrom.png",
    key: "r8"
  },
  81: {
    title: t('region_intros.r9.title', "Golden Sanctum"),
    range: "L81 - L90",
    story: t('region_intros.r9.story', "The final trial accessible only to those who will write their names in history with letters of gold. Every single mile is an epic battle for survival. Those who complete this run are no longer mere sailors, but living legends."),
    image: "The Paragon's Run.png",
    key: "r9"
  },
  91: {
    title: t('region_intros.r10.title', "Legend's End"),
    range: "L91 - L100",
    story: t('region_intros.r10.story', "The earth trembles and the skies shatter as you finally stand before the ultimate battleground, Legend's End. This is the apocalyptic arena where gods have fallen and the greatest heroes of history have met their doom. Every monstrous foe here possesses world-ending power, demanding absolute perfection and tactical mastery from your skills. Gather your most legendary artifacts and form your strongest alliances, for this final expedition will decide the fate of everything. Accept your ultimate destiny now and claim your eternal glory by conquering the supreme challenges of levels 91 to 100!"),
    image: "Legend's End.png",
    key: "r10"
  }
};

interface RegionIntroCardProps {
  startLevel: number;
  onClose: () => void;
}

export const RegionIntroCard: React.FC<RegionIntroCardProps> = ({ startLevel, onClose }) => {
  const details = REGION_INTROS[startLevel];
  if (!details) return null;
  const backgroundUrl = `/assets/episodes/${details.image}`;

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
              <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">{startLevel === 1 ? t('ui.tutorial', "Tutorial") : t('ui.new_region', "New Region")}</div>
              <h2 className="text-2xl font-bold text-white drop-shadow">
                <AutoShrinkText maxFontSize={24}>{details.title}</AutoShrinkText>
              </h2>
              <div className="text-sm font-semibold text-white/80">{details.range}</div>
            </div>
          </div>

          <div className="p-4 bg-black/35 rounded-2xl border border-white/25 mb-6">
            <div className="flex items-center gap-2 text-white/90 font-bold text-xs uppercase tracking-wider mb-2">
              <Waves size={14} />
              {t('common.story', 'Story')}
            </div>
            <p className="text-white font-medium leading-relaxed">
              {details.story}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-amber-400 text-slate-900 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <AutoShrinkText maxFontSize={18}>{t('ui.back_to_level_select', 'BACK TO THE LEVEL SELECTION')}</AutoShrinkText>
          </button>
        </div>
      </div>
    </div>
  );
};
