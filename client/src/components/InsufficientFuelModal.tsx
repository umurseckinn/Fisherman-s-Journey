import React from 'react';
import { Fuel, Play, ArrowLeft, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsufficientFuelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWatchAd: () => void;
    onGetPassCard: () => void;
    onUsePassCard: () => void;
    onGiveUp: () => void;
    fuelCost: number;
    passCards: number;
}

export function InsufficientFuelModal({
    isOpen,
    onClose,
    onWatchAd,
    onGetPassCard,
    onUsePassCard,
    onGiveUp,
    fuelCost,
    passCards
}: InsufficientFuelModalProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-[150] flex items-center justify-center animate-in fade-in duration-300 p-6">
            <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl flex flex-col gap-6 border-4 border-red-100 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center animate-bounce">
                        <Fuel className="w-10 h-10 text-red-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-display font-bold text-slate-800">Insufficient Balance!</h2>
                        <p className="text-slate-500 text-sm mt-2 font-medium">
                            You need <span className="text-red-500 font-bold">{fuelCost} 🪙</span> to buy fuel. Please use a Pass Card or choose an option.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {passCards > 0 ? (
                        <Button
                            onClick={onUsePassCard}
                            className="w-full py-7 text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg border-b-4 border-blue-800 animate-pulse"
                        >
                            <img src="/assets/pass_card.png" alt="Pass" className="w-6 h-8 object-contain" />
                            Use Pass Card ({passCards})
                        </Button>
                    ) : (
                        <Button
                            onClick={onGetPassCard}
                            className="w-full py-7 text-lg font-bold bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-amber-200 border-b-4 border-amber-600"
                        >
                            <img src="/assets/pass_card.png" alt="Pass" className="w-6 h-8 object-contain" />
                            Get More Pass Cards
                        </Button>
                    )}

                    <Button
                        onClick={onWatchAd}
                        className="w-full py-5 text-sm font-bold bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 border-2 border-purple-200 rounded-2xl flex items-center justify-center gap-3"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Watch an Ad (+50 🪙)
                    </Button>

                    <div className="flex flex-col gap-1">
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 hover:bg-transparent rounded-2xl flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Market
                        </Button>

                        <Button
                            onClick={onGiveUp}
                            variant="ghost"
                            className="w-full py-2 text-red-400 text-xs font-bold hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center gap-2"
                        >
                            Give Up (End Journey)
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
