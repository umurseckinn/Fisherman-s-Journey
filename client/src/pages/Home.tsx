import { Play, RotateCcw, X, Lock, Settings, Globe, Anchor } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { InfoCard } from "../components/InfoCard";
import { FishClass } from "../game/types";
import { Link } from "wouter";
import { BoosterPurchaseModal, BoosterType, PurchasePackage } from "../components/BoosterPurchaseModal";
import { resetProfile, getSelectedStartLevel, setSelectedStartLevel, getAdminMode, setAdminMode, getUserSelectedStartLevel, setUserSelectedStartLevel, getUserUnlockedLevel, isTutorialCompleted, getPassCards, addPassCards } from "../game/storage";
import { VEHICLES } from "../game/vehicles";
import { useTranslation, type Language } from "../lib/i18n";
import { AutoShrinkText } from "../components/ui/AutoShrinkText";
import { PassCardPurchaseModal } from "../components/PassCardPurchaseModal";

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "tr", flag: "🇹🇷", label: "TR" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "zh", flag: "🇨🇳", label: "ZH" },
  { code: "de", flag: "🇩🇪", label: "DE" },
  { code: "fr", flag: "🇫🇷", label: "FR" },
  { code: "it", flag: "🇮🇹", label: "IT" },
  { code: "ru", flag: "🇷🇺", label: "RU" },
  { code: "ja", flag: "🇯🇵", label: "JA" },
  { code: "ko", flag: "🇰🇷", label: "KO" },
  { code: "pt-br", flag: "🇧🇷", label: "PT-BR" }
];

export default function Home() {
  const [selectedEntity, setSelectedEntity] = useState<FishClass | null>(null);
  const [purchaseBoosterType, setPurchaseBoosterType] = useState<BoosterType | null>(null);
  const [showPassCardPurchase, setShowPassCardPurchase] = useState(false);
  const [, setPassCardsState] = useState(() => getPassCards());
  const [globalBoosters, setGlobalBoosters] = useState(() => {
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
    return { speed: false, value: false, lucky: false, harpoon: 0, net: 0, tnt: 0, anchor: 0 };
  });
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(() => getAdminMode());
  const [adminSelectedStartLevel, setAdminSelectedStartLevelState] = useState(() => getSelectedStartLevel());
  const [userSelectedStartLevel, setUserSelectedStartLevelState] = useState(() => getUserSelectedStartLevel());
  const [userUnlockedLevel] = useState(() => getUserUnlockedLevel());
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const tutorialDone = isTutorialCompleted();
  const effectiveUserStartLevel = Math.min(userSelectedStartLevel, userUnlockedLevel);

  useEffect(() => {
    // Check for showPicker query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('showPicker') === 'true') {
      setShowLevelPicker(true);
      window.history.replaceState({}, '', '/');
    }

    const handleStorage = () => {
      const saved = localStorage.getItem('global_boosters');
      if (saved) setGlobalBoosters(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('selectedLanguage') ?? localStorage.getItem('language');
    const isValid = LANGUAGE_OPTIONS.some((l) => l.code === stored);
    if (!isValid) setShowWelcomeModal(true);
  }, []);

  useEffect(() => {
    if (!showSettings) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!languageDropdownRef.current) return;
      if (!languageDropdownRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false);
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [showSettings]);

  const selectedLanguageOption =
    LANGUAGE_OPTIONS.find((l) => l.code === currentLanguage) ?? LANGUAGE_OPTIONS[0];

  const selectLanguage = (lang: Language) => {
    localStorage.setItem('selectedLanguage', lang);
    setLanguageDropdownOpen(false);
    setShowWelcomeModal(false);
    changeLanguage(lang);
  };

  const handleBoosterPurchase = (pkg: PurchasePackage) => {
    if (!purchaseBoosterType) return;
    setGlobalBoosters((prev: Record<string, any>) => {
      const next = { ...prev };
      if (pkg.type === 'all') {
        next.harpoon = Math.floor((next.harpoon || 0) + pkg.amount);
        next.net = Math.floor((next.net || 0) + pkg.amount);
        next.tnt = Math.floor((next.tnt || 0) + pkg.amount);
        next.anchor = Math.floor((next.anchor || 0) + pkg.amount);
      } else if (purchaseBoosterType) {
        next[purchaseBoosterType] = Math.floor((next[purchaseBoosterType] || 0) + pkg.amount);
      }
      localStorage.setItem('global_boosters', JSON.stringify(next));
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  };

  const handleCardClick = (type: FishClass) => {
    setSelectedEntity(type);
  };

  const handlePassCardPurchase = (amount: number) => {
    addPassCards(amount);
    setPassCardsState(getPassCards());
    setShowPassCardPurchase(false);
  };

  return (
    <div className="min-h-screen bg-sky-100 flex flex-col items-center justify-center p-4 pt-safe-32 pb-safe-8 relative overflow-x-hidden overflow-y-auto font-sans">
      <style>{`
        .pt-safe-32 { padding-top: calc(env(safe-area-inset-top) + 1.5rem); }
        .pb-safe-8 { padding-bottom: calc(env(safe-area-inset-bottom) + 1.5rem); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-200 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full blur-3xl opacity-50" />

      {/* Main Card */}
      <div className="max-w-sm w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl px-6 py-4 border-4 border-white relative z-10 flex flex-col items-center text-center">
        {/* Settings Button */}
        <button 
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 z-[20] p-2 rounded-xl bg-slate-100/50 backdrop-blur-sm text-blue-500 hover:bg-slate-200/50 active:scale-95 transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
        
        {/* Logo / Icon Area */}
        <div className="flex items-center justify-center -mt-2 -mb-4 transform -rotate-6 hover:rotate-0 transition-transform duration-500 z-0">
          <img
            src="/assets/home-logo-emblem.png"
            alt="Logo"
            className="w-[288px] h-auto md:w-[384px] object-contain drop-shadow-md scale-105"
          />
        </div>

        <h1 className="text-3xl font-display font-black mb-4 mt-2 text-shadow relative z-10">
          <AutoShrinkText
            maxFontSize={30}
            className="[&>span]:font-black [&>span]:bg-clip-text [&>span]:text-transparent [&>span]:bg-gradient-to-r [&>span]:from-black [&>span]:to-sky-400"
          >
            {t('ui.logo_text', "The Boatman's Tale")}
          </AutoShrinkText>
        </h1>

        <div className="mt-2 w-full">
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
            {/* Fish & Environment Cards */}
            {[
              { id: 'bubble', price: '15 🪙', color: '#E8F4FD', img: '/assets/fish/bubble_fish.png', w: 96, h: 72 },
              { id: 'sakura', price: '25 🪙', color: '#FDF0F5', img: '/assets/fish/sakura_fish.png', w: 104, h: 80 },
              { id: 'zap', price: '40 🪙', color: '#FFF6C7', img: '/assets/fish/zap_fish.png', w: 96, h: 72 },
              { id: 'candy', price: '55 🪙', color: '#FFE5EE', img: '/assets/fish/candy_fish.png', w: 96, h: 72 },
              { id: 'moon', price: '80 🪙', color: '#EEF2FF', img: '/assets/fish/moon_fish.png', w: 96, h: 72 },
              { id: 'lava', price: '110 🪙', color: '#FFE3D6', img: '/assets/fish/lava_fish.png', w: 96, h: 72 },
              { id: 'crystal', price: '300 🪙', color: '#EEE8FF', img: '/assets/fish/crystal_fish.png', w: 96, h: 72 },
              { id: 'leaf', price: '200 🪙', color: '#FFE9D6', img: '/assets/fish/leaf_fish.png', w: 96, h: 72 },
              { id: 'tide', price: '150 🪙', color: '#E6F4FF', img: '/assets/fish/tide_fish.png', w: 96, h: 72 },
              { id: 'coral', price: `${t('common.snaps_hook', 'Snaps hook!')} ❌`, color: '#FFF3E0', img: '/assets/environment/coral.png', w: 128, h: 92, danger: true },
              { id: 'gold_doubloon', price: '500 🪙', color: '#FFF8E1', img: '/assets/environment/gold_doubloon.png', w: 96, h: 72 },
              { id: 'whirlpool', price: `${t('common.danger', 'Danger!')} ❌`, color: '#E1F5FE', img: '/assets/environment/whirlpool.png', w: 96, h: 72, danger: true },
              { id: 'sunken_boat', price: `${t('common.obstacle', 'Obstacle')} ❌`, color: '#EFEBE9', img: '/assets/environment/sunken_boat.png', w: 96, h: 72, danger: true },
              { id: 'shark_skeleton', price: '0 🪙', color: '#FAFAFA', img: '/assets/environment/shark_skeleton.png', w: 110, h: 80 },
              { id: 'anchor', price: '150 🪙', color: '#ECEFF1', img: '/assets/environment/anchor.png', w: 110, h: 80 },
              { id: 'shell', price: '25 🪙', color: '#FFF3E0', img: '/assets/environment/shell.png', w: 110, h: 80 },
              { id: 'env_bubbles', price: t('common.boost', 'Boost 💨'), color: '#F0F9FF', img: '/assets/environment/bubbles.png', w: 110, h: 80 },
            ].map(item => {
              const entityName = t(`entities.${item.id}.name`, item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item.id as FishClass)}
                  className={`cursor-pointer flex-shrink-0 w-[120px] rounded-[16px] p-3 pt-4 flex flex-col items-center shadow-sm hover:scale-105 transition-transform duration-150 snap-center group ${item.danger ? 'border border-[#FF5252]' : ''}`}
                  style={{ backgroundColor: item.color }}
                >
                  <div className="w-[80px] h-[80px] flex items-center justify-center mb-2 relative">
                    <img
                      src={item.img}
                      alt={entityName}
                      className="object-contain group-hover:scale-110 transition-transform duration-300"
                      style={{ width: item.w, height: item.h }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{entityName}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full mt-1 ${item.danger ? 'text-[#FF5252] bg-white/50' : 'text-primary bg-white/50'}`}>
                    {item.price}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Shop Section */}
        <div className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl p-2">
          <div className="flex gap-0 justify-between overflow-x-auto overflow-y-hidden pb-1 hide-scrollbar">
            {[
              { id: 'harpoon', img: '/assets/boosters/harpoon.png', color: 'text-yellow-600', count: globalBoosters.harpoon, label: t('common.harpoon', 'Harpoon') },
              { id: 'net', img: '/assets/boosters/net.png', color: 'text-blue-600', count: globalBoosters.net, label: t('common.net', 'Net') },
              { id: 'tnt', img: '/assets/boosters/tnt.png', color: 'text-red-600', count: globalBoosters.tnt, label: t('common.tnt', 'TNT') },
              { id: 'anchor', img: '/assets/boosters/the_anchor.png', color: 'text-slate-600', count: globalBoosters.anchor, label: t('common.anchor_booster', 'Anchor') },
            ].map(booster => (
              <button
                key={booster.id}
                onClick={() => setPurchaseBoosterType(booster.id as BoosterType)}
                className="flex-1 flex flex-col items-center bg-transparent rounded-xl px-1 py-2 hover:scale-105 hover:-translate-y-1 transition-all shrink-0 min-w-[70px]"
              >
                <img src={booster.img} alt={booster.label} className="w-20 h-20 max-w-none object-contain scale-125 hover:scale-150 transition-transform origin-center drop-shadow-md mb-0" />
                <span className="text-[11px] font-extrabold text-slate-700 bg-white/50 px-2 py-0.5 rounded-full backdrop-blur-sm z-10 relative">{booster.label}</span>
                <span className={`text-sm font-black ${booster.color} leading-tight`}>{booster.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full space-y-3 mt-4">
          <Link href={!tutorialDone ? "/game" : "/garage"}>
            <button className={`w-full group relative overflow-hidden ${!tutorialDone ? 'bg-amber-500 shadow-amber-500/25' : 'bg-primary shadow-blue-500/25'} text-white p-4 rounded-2xl font-bold text-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center justify-center gap-3 text-shadow-sm">
                <Play className="w-6 h-6 fill-current" />
                {!tutorialDone ? t('ui.play_tutorial', 'PLAY TUTORIAL') : t('ui.play_game', 'PLAY THE GAME')}
              </div>
            </button>
          </Link>
        </div>
      </div>

      {/* Modals */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 relative border-4 border-slate-100">
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-slate-800 font-display">
                Select Your Language / Dilinizi Seçin
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => selectLanguage(lang.code)}
                  className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 transition-all ${
                    currentLanguage === lang.code
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <span className="text-2xl leading-none">{lang.flag}</span>
                  <span className="font-black uppercase text-xs tracking-wider">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 relative border-4 border-slate-100">
            <button 
              onClick={() => {
                setShowSettings(false);
                setLanguageDropdownOpen(false);
              }}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-500">
                <Settings className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{t('ui.settings', 'Settings')}</h2>
            </div>

            <div className="space-y-6">
              {/* Language Selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <Globe className="w-4 h-4" />
                  {t('common.language', 'Language')}
                </label>
                <div ref={languageDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setLanguageDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-center rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-white hover:border-primary/20 transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{selectedLanguageOption.flag}</span>
                      <span className="font-black uppercase tracking-wider">{selectedLanguageOption.label}</span>
                    </span>
                  </button>

                  {languageDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-slate-100 shadow-2xl overflow-hidden z-50">
                      <div className="max-h-64 overflow-y-auto hide-scrollbar">
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => selectLanguage(lang.code)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left font-bold transition-colors ${
                              currentLanguage === lang.code
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xl leading-none">{lang.flag}</span>
                            <span className="uppercase tracking-wider">{lang.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Mode Toggle */}
              <div className="flex items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-600">
                <span className="flex items-center gap-2 italic uppercase">
                  <Lock className="w-4 h-4 opacity-50" />
                  Admin Mode
                </span>
                <button
                  onClick={() => {
                    const next = !isAdminMode;
                    setAdminMode(next);
                    setIsAdminMode(next);
                  }}
                  className={`relative h-8 w-24 rounded-full transition-colors ${isAdminMode ? "bg-yellow-400" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${isAdminMode ? "left-[3.25rem]" : "left-1"}`} />
                  <span className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-black text-slate-800">
                    <span className={isAdminMode ? "opacity-100" : "opacity-30"}>ADM</span>
                    <span className={!isAdminMode ? "opacity-100" : "opacity-30"}>USR</span>
                  </span>
                </button>
              </div>

              {/* Levels Selector */}
              <button
                onClick={() => {
                  setShowLevelPicker(true);
                }}
                className="w-full flex items-center justify-between rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-white hover:border-primary/20 transition-all"
              >
                <span className="flex items-center gap-2 italic uppercase">
                  <Anchor className="w-4 h-4 opacity-50" />
                  Select Level
                </span>
                <span className="text-primary font-black bg-blue-50 px-3 py-1 rounded-lg">
                  {isAdminMode
                    ? (adminSelectedStartLevel === 1 ? "Tutorial" : `Level ${adminSelectedStartLevel - 1}`)
                    : (tutorialDone ? `Level ${effectiveUserStartLevel - 1}` : 'Tutorial')}
                </span>
              </button>

              {/* Reset Progress Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (confirm(t('ui.reset_confirm', 'Are you sure? This will reset all your progress!'))) {
                      resetProfile(VEHICLES.map(v => v.id));
                      window.location.reload();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  {t('ui.reset_progress', 'Reset Progress')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEntity && (
        <InfoCard
          entityKey={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}

      {purchaseBoosterType && (
        <BoosterPurchaseModal
          isOpen={true}
          onClose={() => setPurchaseBoosterType(null)}
          boosterType={purchaseBoosterType}
          onPurchase={handleBoosterPurchase}
        />
      )}

      {showPassCardPurchase && (
        <PassCardPurchaseModal 
          onClose={() => setShowPassCardPurchase(false)}
          onPurchase={(amount) => handlePassCardPurchase(amount)}
        />
      )}

      {showLevelPicker && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl border-4 border-slate-100 p-6 relative">
            <button
              onClick={() => setShowLevelPicker(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-4">
              <div className="text-xl font-bold text-slate-800">{t('ui.levels_title', 'LEVELS')}</div>
              <div className="text-xs text-slate-500 mt-1">
                {isAdminMode ? t('ui.admin_mode_msg', "Admin mode selection") : t('ui.unlocked_up_to', `Unlocked up to L{level}`, { level: userUnlockedLevel })}
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1 hide-scrollbar">
              {Array.from({ length: 100 }, (_, i) => i + 1).map(num => {
                const internalLevel = num;
                const isSelected = isAdminMode
                  ? internalLevel === adminSelectedStartLevel
                  : internalLevel === effectiveUserStartLevel;
                const isLocked = !isAdminMode && internalLevel > userUnlockedLevel;
                const isTutorial = internalLevel === 1;

                if (!isAdminMode && isTutorial && tutorialDone) return null;

                return (
                  <button
                    key={num}
                    onClick={() => {
                      if (isLocked) return;
                      if (isAdminMode) {
                        setAdminSelectedStartLevelState(internalLevel);
                        setSelectedStartLevel(internalLevel);
                      } else {
                        setUserSelectedStartLevelState(internalLevel);
                        setUserSelectedStartLevel(internalLevel);
                      }
                      setShowLevelPicker(false);
                    }}
                    className={`
                      h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all relative
                      ${isLocked ? 'bg-slate-50 text-slate-300 cursor-not-allowed' :
                        isSelected ? 'bg-primary text-white shadow-lg shadow-blue-200 scale-105 z-10' :
                        'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                    `}
                  >
                    {isLocked && <Lock className="w-3 h-3 absolute top-1 right-1 opacity-40" />}
                    {isTutorial ? "Tut" : num - 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admin Mode Switch (Hidden toggle) */}
      <div 
        className="fixed bottom-4 left-4 w-8 h-8 opacity-0 hover:opacity-10 cursor-pointer z-50"
        onClick={() => {
          const next = !isAdminMode;
          setIsAdminMode(next);
          setAdminMode(next);
        }}
      />
    </div>
  );
}
