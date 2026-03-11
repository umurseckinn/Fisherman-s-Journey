import React from 'react';
import { X, Coins, Weight, Zap, Info } from 'lucide-react';
import { FishClass, OBJECT_MATRIX } from '../game/types';

interface InfoCardProps {
  entityKey: FishClass;
  onClose: () => void;
}

const ENTITY_DETAILS: Record<string, { story: string; effect: string }> = {
  bubble: {
    story: "Bubble Fish drift near the surface like living lanterns. Their scales catch the light and shimmer with a glassy glow. Sailors say they gather when the sea is calm to mark safe water. They rarely travel alone, turning the surface into a floating constellation.",
    effect: "Harmless catch with low value and light weight."
  },
  sakura: {
    story: "Sakura Fish bloom in the shallows every spring tide. They move in soft, petal-like swirls that calm even rough waters. Old captains call them the ocean’s lucky charm because their trail points toward safe passages. Catching one is said to make the next journey kinder.",
    effect: "Leaves a trail of petals and moves quickly in shallow water."
  },
  zap: {
    story: "Zap Fish are born inside storm bands and carry the thunder with them. Their bodies spark when they turn, lighting the water in sudden flashes. Fisherfolk respect them because a single jolt can change a day’s haul. They never slow down unless the sea itself does.",
    effect: "Shocks the boat for 3s, giving a 50% escape chance to other fish."
  },
  candy: {
    story: "Candy Fish gather around warm currents where sweet kelp grows. Their bright colors are a warning to rivals and a beacon to divers. Some say their flavor can lighten the heart and the hull alike. A quiet shoal of Candy Fish often signals a rich mid-depth lane.",
    effect: "Reduces boat weight by 1 on catch, up to 3 times."
  },
  moon: {
    story: "Moon Fish glow whenever the night sky is clear. They glide with a slow rhythm, as if listening to tides only they can hear. Deep sailors believe they guard hidden paths between regions. When a Moon Fish rises, the whole sea seems to breathe slower.",
    effect: "Slows all other fish by 40% for 10s."
  },
  lava: {
    story: "Lava Fish swim through vents where the water boils. Their heat leaves a wake of shimmering air, and their presence makes metal creak. Legends claim they are forged in volcanic storms beneath the trench. Catching one feels like holding a living ember.",
    effect: "Applies burning, adding +1 weight per second for 5s."
  },
  tide: {
    story: "Tide Fish race like torpedoes at the edge of storms. Their fins carve sharp lines through the current, and their speed startles even predators. Mariners track them to predict sudden shifts in water pressure. One wrong move and they vanish in the spray.",
    effect: "Shakes the boat and has a 20% chance to drop a random item."
  },
  leaf: {
    story: "Leaf Fish are whispered about more than they are seen. They ride gentle eddies, light as drifting kelp, and vanish at the first sign of danger. Ancient crews believed a Leaf Fish ensures prosperity for the entire voyage. Its presence turns markets in your favor.",
    effect: "Permanently increases market value by 10% per catch, up to 30%."
  },
  crystal: {
    story: "Crystal Fish grow in slow caves where minerals bloom like flowers. Their bodies refract light into strange colors that shift with every turn. Merchants argue over their value because no two catches are the same. They are beauty and risk wrapped together.",
    effect: "Value shifts on catch: +50, 0, or -30 Gold Doubloons."
  },
  galaxy: {
    story: "Galaxy Fish are said to swim between currents and stars. They blink out of sight and reappear in a blink, leaving only a trail of violet haze. Explorers chase them for luck, not just profit. If one finds you, the sea often rewards your courage.",
    effect: "Grants a random bonus: +100 Gold Doubloons or +10% fuel."
  },
  mushroom: {
    story: "Mushroom Fish drift through deep spores that glitter like snow. Their fins leave a faint fog that clings to the hull. Old journals describe them as “the harvest of the abyss.” When caught, their strange magic doubles a treasure already held.",
    effect: "Doubles the market value of a random inventory fish."
  },
  king: {
    story: "The King Fish is a living legend, and the sea goes quiet when it passes. Its scales are gold-tinted and heavy like forged armor. Small fish scatter at its wake, as if it commands the current. To haul one up is to claim a crown for the voyage.",
    effect: "Panics small fish and boosts market values by 20%."
  },
  coral: {
    story: "Coral Reef clusters are silent guardians of the seabed. They gleam like bone and glass in the dim light. Hooks that touch them often return broken or tangled. Sailors treat them as sacred borders, not trophies.",
    effect: "Breaks one fishing hook attempt on contact."
  },
  sea_kelp: {
    story: "Sea Kelp sways like slow ribbons across the ocean floor. It looks gentle, but it can grip a line with surprising strength. Many hooks have been lost to its quiet drag. The wise let it pass and watch the current instead.",
    effect: "Snags the hook briefly without damage."
  },
  sea_kelp_horizontal: {
    story: "Horizontal Kelp grows in flat sheets that hide in the silt. It can snag a line and pull it sideways without warning. Divers say it marks ancient flood paths across the seabed. A careful cast slips past; a rushed one gets caught.",
    effect: "Snags the hook briefly without damage."
  },
  sea_rock: {
    story: "Sea Rocks are the old bones of the coastline. They sit quietly until a line strikes them and snaps tension through the rod. Crews avoid them because they waste time and attempts. The sea keeps them as silent obstacles.",
    effect: "Bounces the hook back instantly on impact."
  },
  sea_rock_large: {
    story: "Large Sea Rocks are hidden reefs that rise like walls. Their mass can stop even a strong cast in its tracks. Captains chart them because they split currents in unpredictable ways. They never move, but they shape the whole hunt.",
    effect: "Bounces the hook back instantly on impact."
  },
  gold_doubloon: {
    story: "Gold Doubloons drift from shipwrecks like fallen stars. They shimmer in the dark and lure the greedy close to danger. Each one carries a story from a lost voyage. When you take one, the sea demands a heavier price.",
    effect: "Adds +10 kg weight but grants high level-scaled gold."
  },
  whirlpool: {
    story: "Whirlpools are wounds in the ocean, spinning faster than sight. They hum with a low roar that rattles the deck. Many crews have chased treasure into their spiral and never returned. Survive a whirlpool and the sea will remember your name.",
    effect: "Can sink the boat if the hook is trapped too long."
  },
  sunken_boat: {
    story: "Sunken Boats are tombs of old voyages. Their hulls creak in the current, and their shadows stretch far in the deep. They block clean lines and tempt reckless dives. Every wreck is a warning carved from history.",
    effect: "Solid obstacle, extremely heavy, and blocks safe movement."
  },
  shark_skeleton: {
    story: "Shark Skeletons drift like haunted relics through the deep. They tell a tale of battles fought and lost beneath the waves. Their jagged bones catch hooks and snag lines. A catch of bones brings only regret and a small penalty.",
    effect: "Adds unwanted weight and reduces gold by 10."
  },
  env_bubbles: {
    story: "Bubbles rise in clusters from hidden vents. They look harmless, but they change the buoyancy of everything they touch. Divers chase them for the strange lift they give to gear. Catching one feels like the sea pushing you upward.",
    effect: "Boosts hook speed and temporarily reduces weight."
  },
  anchor: {
    story: "Rusty Anchors lie where ships once prayed for calm seas. They are relics of storms survived and storms lost. Pulling one free feels like lifting a piece of the sea itself. Heavy and valuable, they test both patience and strength.",
    effect: "High value but very heavy at 10 units."
  },
  shell: {
    story: "Sea Shells hide in soft sand, waiting for the gentle touch of a line. Some glow faintly, as if holding a secret light. Collectors prize them because each one holds a different story of the tide. They are small, but the sea often rewards the curious.",
    effect: "Grants +20 Gold Doubloons on catch."
  }
};

export const InfoCard: React.FC<InfoCardProps> = ({ entityKey, onClose }) => {
  const config = OBJECT_MATRIX[entityKey];
  const details = ENTITY_DETAILS[entityKey] || { story: "A deep sea mystery with no known record.", effect: "Unknown." };
  const isObstacle = Boolean(config.isObstacle);
  const isEnvironment = ['coral', 'sea_kelp', 'sea_kelp_horizontal', 'sea_rock', 'sea_rock_large', 'gold_doubloon', 'whirlpool', 'sunken_boat', 'shark_skeleton', 'anchor', 'shell', 'env_bubbles'].includes(entityKey);
  const imageName = entityKey === 'env_bubbles' ? 'bubbles' : entityKey;
  const imagePath = isEnvironment ? `/assets/environment/${imageName}.png` : `/assets/fish/${imageName}_fish.png`;
  const stats = [
    { label: 'Type', value: isObstacle ? 'Obstacle' : 'Catchable' },
    { label: 'Speed', value: `x${config.speedMultiplier}` },
    { label: 'Weight', value: `${config.weightMultiplier} kg` },
    { label: 'Value', value: `${config.value}` },
    { label: 'Radius', value: `${config.radius}px` },
    { label: 'Aspect', value: `${config.aspectRatio}` }
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 border-4 border-white overflow-y-auto max-h-[85vh] flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border-4 border-slate-100">
          <img
            src={imagePath}
            alt={config.names[0]}
            className="w-32 h-32 object-contain drop-shadow-lg"
          />
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-2">{config.names[0]}</h2>

        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold text-sm">
            <img src="/assets/environment/gold_doubloon.png" alt="" className="w-3.5 h-3.5 object-contain" />
            {config.value}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
            <Weight size={14} />
            {config.weightMultiplier} kg
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full mb-6">
          {stats.map(stat => (
            <div key={stat.label} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600">
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wide">{stat.label}</div>
              <div className="text-slate-700">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="w-full space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
              <Info size={14} />
              Story
            </div>
            <p className="text-slate-600 font-medium leading-relaxed">
              {details.story}
            </p>
          </div>

          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
              <Zap size={14} />
              Ability / Effect
            </div>
            <p className="text-slate-700 font-bold leading-relaxed">
              {details.effect}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
