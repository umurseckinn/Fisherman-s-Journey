import React from 'react';
import { Wrench, Play, ArrowLeft, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsufficientRepairModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWatchAd: () => void;
    onGetDoubloons: () => void;
    repairCost: number;
}

export function InsufficientRepairModal({
    isOpen,
    onClose,
    onWatchAd,
    onGetDoubloons,
    repairCost
}: InsufficientRepairModalProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-[150] flex items-center justify-center animate-in fade-in duration-300 p-6">
            <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl flex flex-col gap-6 border-4 border-amber-100 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-50 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center animate-bounce">
                        <Wrench className="w-10 h-10 text-amber-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-display font-bold text-slate-800">Repair Needed!</h2>
                        <p className="text-slate-500 text-sm mt-2 font-medium">
                            You need <span className="text-amber-500 font-bold">{repairCost} 🪙</span> to repair the rod. Please choose an option to continue.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={onWatchAd}
                        className="w-full py-7 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-purple-200"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        Watch an Ad (+50)
                    </Button>

                    <Button
                        onClick={onGetDoubloons}
                        className="w-full py-7 text-lg font-bold bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-amber-200"
                    >
                        <Coins className="w-5 h-5" />
                        Get More Doubloons
                    </Button>

                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 hover:bg-transparent rounded-2xl flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Market
                    </Button>
                </div>
            </div>
        </div>
    );
}
