import React, { useState } from 'react';
import { X, Star, Shield, Gift, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

const BOOSTER_CONFIG = {
    harpoon: { imageSrc: '/assets/boosters/harpoon.png', label: 'Harpoon', phrase: 'Spear those stubborn catches effortlessly!', glow: 'shadow-yellow-500/50' },
    net: { imageSrc: '/assets/boosters/net.png', label: 'Net', phrase: 'Scoop up everything in your path!', glow: 'shadow-blue-500/50' },
    tnt: { imageSrc: '/assets/boosters/tnt.png', label: 'TNT', phrase: 'Clear the seabed with an explosive blast!', glow: 'shadow-red-500/50' },
    anchor: { imageSrc: '/assets/boosters/the_anchor.png', label: 'Anchor', phrase: 'Freeze time and grab what you want!', glow: 'shadow-slate-500/50' }
};

export function BoosterPurchaseModal({
    isOpen,
    onClose,
    boosterType,
    onPurchase
}: BoosterPurchaseModalProps) {
    if (!isOpen) return null;

    const activeConfig = BOOSTER_CONFIG[boosterType];
    const [showInfo, setShowInfo] = useState(false);
    const infoMap: Record<BoosterType, { title: string; summary: string; usage: string[]; tips: string[] }> = {
        harpoon: {
            title: 'Harpoon',
            summary: 'Fires a straight spear to grab a single target instantly.',
            usage: [
                'Tap to launch; it pierces forward and grabs the first valid target.',
                'Best for high‑value fish or tight corridors where precision matters.',
                'Harpoon catches do not add to storage weight while carried by the booster.'
            ],
            tips: [
                'Use while the target is aligned with the boat’s line.',
                'Great for escaping clutch moments when time is low.'
            ]
        },
        net: {
            title: 'Net',
            summary: 'Casts a wide net that gathers multiple fish in its radius.',
            usage: [
                'Tap to deploy; everything inside the circle is collected.',
                'Perfect for dense schools and stacked spawns.',
                'Net catches do not add to storage weight while carried by the booster.'
            ],
            tips: [
                'Wait for a cluster before triggering to maximize value.',
                'Combine with slow moments to sweep large groups.'
            ]
        },
        tnt: {
            title: 'TNT',
            summary: 'Detonates a 3×3 area to clear obstacles and grab loot.',
            usage: [
                'Tap to place; the blast clears the grid instantly.',
                'Ideal for heavy obstacle zones and blocked paths.',
                'TNT pickups do not add to storage weight while carried by the booster.'
            ],
            tips: [
                'Drop it where obstacles are densest for maximum impact.',
                'Use to open routes when you are trapped.'
            ]
        },
        anchor: {
            title: 'Anchor',
            summary: 'Freezes time briefly so you can aim and collect safely.',
            usage: [
                'Tap to activate; time slows and movement becomes manageable.',
                'Best for precise grabs and avoiding hazards.',
                'Anchor pickups do not add to storage weight while carried by the booster.'
            ],
            tips: [
                'Trigger it right before a risky cast.',
                'Use it to stabilize when hooks are low.'
            ]
        }
    };

    const handleBuy = (pkg: PurchasePackage) => {
        // Fake processing delay for visual feedback if desired, or just instant:
        onPurchase(pkg);
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center animate-in fade-in duration-300 p-4">
            <div className="bg-black rounded-[32px] w-full max-w-sm p-6 shadow-2xl flex flex-col gap-6 border-4 border-yellow-500/80 relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-600/20 rounded-full blur-3xl pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-all z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center text-center mt-2 relative z-10">
                    <button
                        onClick={() => setShowInfo(true)}
                        className="absolute left-0 top-0 p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                    <div className={`w-40 h-40 flex items-center justify-center mb-4 relative`}>
                        <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-40 h-40 object-contain filter drop-shadow-xl relative z-10 scale-125" />
                    </div>
                    <h2 className="text-3xl font-display font-extrabold text-yellow-500 tracking-tight text-shadow-sm">Out of {activeConfig.label}?</h2>
                    <p className="text-yellow-100/80 text-sm mt-2 font-medium">{activeConfig.phrase}</p>
                </div>

                {/* Purchase Options */}
                <div className="flex flex-col gap-3 relative z-10">
                    {/* Mega Pack — $7.99 USD (10x ALL Boosters) */}
                    <button
                        onClick={() => handleBuy({ type: 'all', amount: 10, cost: 7.99, currency: 'usd' })}
                        className="group relative flex items-center justify-between bg-gradient-to-r from-yellow-300 to-yellow-500 p-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-yellow-500/40 border border-yellow-200/50 overflow-hidden"
                    >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                                <Gift className="w-6 h-6 text-yellow-900" />
                            </div>
                            <div className="text-left flex flex-col">
                                <span className="font-bold text-yellow-900 text-lg leading-tight">Mega Pack</span>
                                <span className="text-yellow-900/80 text-xs font-bold">10x ALL Boosters</span>
                            </div>
                        </div>
                        <div className="bg-yellow-900 text-yellow-400 font-extrabold px-3 py-1.5 rounded-lg shadow-sm border border-yellow-700/50">
                            $7.99
                        </div>
                    </button>

                    {/* Epic Pack — $2.99 USD (3x ALL Boosters) */}
                    <button
                        onClick={() => handleBuy({ type: 'all', amount: 3, cost: 2.99, currency: 'usd' })}
                        className="group relative flex items-center justify-between bg-gradient-to-r from-amber-600 to-amber-700 p-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg border border-amber-400/30"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                                <Shield className="w-6 h-6 text-yellow-100" />
                            </div>
                            <div className="text-left flex flex-col">
                                <span className="font-bold text-yellow-100 text-lg leading-tight">Epic Pack</span>
                                <span className="text-yellow-200/80 text-xs font-bold">3x ALL Boosters</span>
                            </div>
                        </div>
                        <div className="bg-yellow-900 text-yellow-500 font-extrabold px-3 py-1.5 rounded-lg shadow-sm border border-yellow-700/50">
                            $2.99
                        </div>
                    </button>

                    {/* Booster Specific Packs */}
                    <div className="grid grid-cols-2 gap-3 mt-1">
                        {/* 3x single — $0.99 USD */}
                        <button
                            onClick={() => handleBuy({ type: 'single', amount: 3, cost: 0.99, currency: 'usd' })}
                            className="flex flex-col items-center justify-center bg-black/50 border-2 border-yellow-700/30 p-3 rounded-2xl hover:bg-yellow-900/20 hover:border-yellow-600/50 transition-all hover:scale-[1.05] active:scale-95 shadow-none"
                        >
                            <div className="flex -space-x-6 mb-2">
                                <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-16 h-16 object-contain drop-shadow-md relative z-30" />
                                <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-16 h-16 object-contain drop-shadow-md opacity-80 relative z-20" />
                                <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-16 h-16 object-contain drop-shadow-md opacity-60 relative z-10" />
                            </div>
                            <span className="font-bold text-yellow-500 text-sm">3x {activeConfig.label}</span>
                            <span className="text-yellow-100/80 font-black mt-1">$0.99</span>
                        </button>

                        {/* 1x single — 500 Gold Doubloons */}
                        <button
                            onClick={() => handleBuy({ type: 'single', amount: 1, cost: 500, currency: 'doubloons' })}
                            className="flex flex-col items-center justify-center bg-black/50 border-2 border-yellow-700/30 p-3 rounded-2xl hover:bg-yellow-900/20 hover:border-yellow-600/50 transition-all hover:scale-[1.05] active:scale-95 shadow-none"
                        >
                            <div className="mb-2">
                                <img src={activeConfig.imageSrc} alt={activeConfig.label} className="w-24 h-24 object-contain drop-shadow-md" />
                            </div>
                            <span className="font-bold text-yellow-500 text-sm">1x {activeConfig.label}</span>
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
                            <div className="font-bold text-yellow-300 mb-2">How it works</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {infoMap[boosterType].usage.map(line => (
                                    <li key={line}>{line}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-left text-sm text-slate-100/90">
                            <div className="font-bold text-yellow-300 mb-2">Tips</div>
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
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
