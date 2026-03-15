import React, { useState } from 'react';
import { X, Star, Shield, Gift, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { t } from '@/lib/i18n';

export type BoosterType = 'harpoon' | 'net' | 'tnt' | 'anchor';

export interface PurchasePackage {
    type: 'all' | 'single';
    amount: number;
    cost: number; // in Gold Doubloons (in-game) or USD (premium)
    currency?: 'doubloons' | 'usd';
}

interface BoosterPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    boosterType: BoosterType;
    onPurchase: (pkg: PurchasePackage) => void;
}

export function BoosterPurchaseModal({
    isOpen,
    onClose,
    boosterType,
    onPurchase
}: BoosterPurchaseModalProps) {
    if (!isOpen) return null;

    const [showInfo, setShowInfo] = useState(false);

    // Dynamic config using t()
    const activeConfig = {
        harpoon: { 
            imageSrc: '/assets/boosters/harpoon.png', 
            label: t('common.harpoon', 'Harpoon'), 
            phrase: t('ui.boosters.harpoon.phrase', 'Spear those stubborn catches effortlessly!') 
        },
        net: { 
            imageSrc: '/assets/boosters/net.png', 
            label: t('common.net', 'Net'), 
            phrase: t('ui.boosters.net.phrase', 'Scoop up everything in your path!') 
        },
        tnt: { 
            imageSrc: '/assets/boosters/tnt.png', 
            label: t('common.tnt', 'TNT'), 
            phrase: t('ui.boosters.tnt.phrase', 'Clear the seabed with an explosive blast!') 
        },
        anchor: { 
            imageSrc: '/assets/boosters/the_anchor.png', 
            label: t('common.anchor_booster', 'Anchor'), 
            phrase: t('ui.boosters.anchor.phrase', 'Freeze time and grab what you want!') 
        }
    }[boosterType];

    const infoMap = {
        harpoon: {
            title: t('common.harpoon', 'Harpoon'),
            summary: t('ui.boosters.harpoon.summary', 'Fires a straight spear to grab a single target instantly.'),
            usage: (t('ui.boosters.harpoon.usage', []) as string[]),
            tips: (t('ui.boosters.harpoon.tips', []) as string[])
        },
        net: {
            title: t('common.net', 'Net'),
            summary: t('ui.boosters.net.summary', 'Casts a wide net that gathers multiple fish in its radius.'),
            usage: (t('ui.boosters.net.usage', []) as string[]),
            tips: (t('ui.boosters.net.tips', []) as string[])
        },
        tnt: {
            title: t('common.tnt', 'TNT'),
            summary: t('ui.boosters.tnt.summary', 'Detonates a 3x3 area to clear obstacles and grab loot.'),
            usage: (t('ui.boosters.tnt.usage', []) as string[]),
            tips: (t('ui.boosters.tnt.tips', []) as string[])
        },
        anchor: {
            title: t('common.anchor_booster', 'Anchor'),
            summary: t('ui.boosters.anchor.summary', 'Freezes time briefly so you can aim and collect safely.'),
            usage: (t('ui.boosters.anchor.usage', []) as string[]),
            tips: (t('ui.boosters.anchor.tips', []) as string[])
        }
    };

    const handleBuy = (pkg: PurchasePackage) => {
        onPurchase(pkg);
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center animate-in fade-in duration-300 p-4">
            <div className="bg-black rounded-[32px] w-full max-w-sm p-6 shadow-2xl flex flex-col gap-6 border-4 border-yellow-500/80 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-600/20 rounded-full blur-3xl pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-all z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center text-center mt-2 relative z-10">
                    <button
                        onClick={() => setShowInfo(true)}
                        className="absolute left-0 top-0 p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                    <div className="w-40 h-40 flex items-center justify-center mb-4 relative">
                        <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-40 h-40 object-contain filter drop-shadow-xl relative z-10 scale-125" />
                    </div>
                    <h2 className="text-3xl font-display font-extrabold text-yellow-500 tracking-tight text-shadow-sm">
                        {t('ui.boosters.out_of', 'Out of {booster}?', { booster: activeConfig.label })}
                    </h2>
                    <p className="text-yellow-100/80 text-sm mt-2 font-medium">{activeConfig.phrase}</p>
                </div>

                <div className="flex flex-col gap-3 relative z-10">
                    <button
                        onClick={() => handleBuy({ type: 'all', amount: 10, cost: 7.99, currency: 'usd' })}
                        className="group relative flex items-center justify-between bg-gradient-to-r from-yellow-300 to-yellow-500 p-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-yellow-500/40 border border-yellow-200/50 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                                <Gift className="w-6 h-6 text-yellow-900" />
                            </div>
                            <div className="text-left flex flex-col">
                                <span className="font-bold text-yellow-900 text-lg leading-tight">{t('ui.boosters.mega_pack', 'Mega Pack')}</span>
                                <span className="text-yellow-900/80 text-xs font-bold">{t('ui.boosters.all_boosters', '10x ALL Boosters', { amount: 10 })}</span>
                            </div>
                        </div>
                        <div className="bg-yellow-900 text-yellow-400 font-extrabold px-3 py-1.5 rounded-lg shadow-sm border border-yellow-700/50">
                            $7.99
                        </div>
                    </button>

                    <button
                        onClick={() => handleBuy({ type: 'all', amount: 3, cost: 2.99, currency: 'usd' })}
                        className="group relative flex items-center justify-between bg-gradient-to-r from-amber-600 to-amber-700 p-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg border border-amber-400/30"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                                <Shield className="w-6 h-6 text-yellow-100" />
                            </div>
                            <div className="text-left flex flex-col">
                                <span className="font-bold text-yellow-100 text-lg leading-tight">{t('ui.boosters.epic_pack', 'Epic Pack')}</span>
                                <span className="text-yellow-200/80 text-xs font-bold">{t('ui.boosters.all_boosters', '3x ALL Boosters', { amount: 3 })}</span>
                            </div>
                        </div>
                        <div className="bg-yellow-900 text-yellow-500 font-extrabold px-3 py-1.5 rounded-lg shadow-sm border border-yellow-700/50">
                            $2.99
                        </div>
                    </button>

                    <div className="grid grid-cols-2 gap-3 mt-1">
                        <button
                            onClick={() => handleBuy({ type: 'single', amount: 3, cost: 0.99, currency: 'usd' })}
                            className="flex flex-col items-center justify-center bg-black/50 border-2 border-yellow-700/30 p-3 rounded-2xl hover:bg-yellow-900/20 hover:border-yellow-600/50 transition-all hover:scale-[1.05] active:scale-95 shadow-none"
                        >
                            <div className="flex -space-x-6 mb-2">
                                <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-16 h-16 object-contain drop-shadow-md relative z-30" />
                                <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-16 h-16 object-contain drop-shadow-md opacity-80 relative z-20" />
                                <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-16 h-16 object-contain drop-shadow-md opacity-60 relative z-10" />
                            </div>
                            <span className="font-bold text-yellow-500 text-sm">{t('ui.boosters.single_booster', '3x {booster}', { amount: 3, booster: activeConfig.label })}</span>
                            <span className="text-yellow-100/80 font-black mt-1">$0.99</span>
                        </button>

                        <button
                            onClick={() => handleBuy({ type: 'single', amount: 1, cost: 500, currency: 'doubloons' })}
                            className="flex flex-col items-center justify-center bg-black/50 border-2 border-yellow-700/30 p-3 rounded-2xl hover:bg-yellow-900/20 hover:border-yellow-600/50 transition-all hover:scale-[1.05] active:scale-95 shadow-none"
                        >
                            <div className="mb-2">
                                <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-24 h-24 object-contain drop-shadow-md" />
                            </div>
                            <span className="font-bold text-yellow-500 text-sm">{t('ui.boosters.single_booster', '1x {booster}', { amount: 1, booster: activeConfig.label })}</span>
                            <span className="text-yellow-100/80 font-black mt-1 flex items-center gap-1">
                                <img src="/assets/environment/gold_doubloon.png" alt="" style={{width:'14px',height:'14px',objectFit:'contain'}} />
                                500
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            {showInfo && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-black rounded-[32px] w-full max-w-sm p-6 shadow-2xl flex flex-col gap-5 border-4 border-yellow-500/80 relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-600/20 rounded-full blur-3xl pointer-events-none" />

                        <button
                            onClick={() => setShowInfo(false)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-3 relative z-10">
                            <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-12 h-12 object-contain drop-shadow-md" />
                            <div>
                                <div className="text-yellow-400 font-bold text-xl">{infoMap[boosterType].title}</div>
                                <div className="text-yellow-100/80 text-sm">{infoMap[boosterType].summary}</div>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-left text-sm text-slate-100/90">
                            <div className="font-bold text-yellow-300 mb-2">{t('ui.boosters.how_it_works', 'How it works')}</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {infoMap[boosterType].usage.map(line => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-left text-sm text-slate-100/90">
                            <div className="font-bold text-yellow-300 mb-2">{t('ui.boosters.tips', 'Tips')}</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {infoMap[boosterType].tips.map(line => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            onClick={() => setShowInfo(false)}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
                        >
                            {t('common.close', 'Close')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
