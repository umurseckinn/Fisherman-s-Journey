import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type MarketTutorialStep = 'sell' | 'fuel' | 'continue' | 'completed';

interface MarketTutorialOverlayProps {
    step: MarketTutorialStep;
}

export const MarketTutorialOverlay: React.FC<MarketTutorialOverlayProps> = ({ step }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const stepConfig = {
        sell: {
            id: 'market-sell-all',
            text: "Great catch! Tap here to sell your fish and earn Gold Doubloons.",
            position: 'bottom' as const,
        },
        fuel: {
            id: 'market-buy-fuel',
            text: "You need fuel to keep sailing. Tap here to refill your tank.",
            position: 'bottom' as const,
        },
        continue: {
            id: 'market-next-level',
            text: "You're all set! Tap here to embark on your next adventure.",
            position: 'top' as const,
        },
        completed: {
            id: '',
            text: '',
            position: 'top' as const,
        }
    };

    useEffect(() => {
        const updateRect = () => {
            const config = stepConfig[step];
            if (!config.id) {
                setTargetRect(null);
                return;
            }
            const el = document.getElementById(config.id);
            if (el) {
                setTargetRect(el.getBoundingClientRect());
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);

        // Poll for changes (e.g. layout shifts)
        const interval = setInterval(updateRect, 500);

        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect);
            clearInterval(interval);
        };
    }, [step]);

    if (step === 'completed' || !targetRect) return null;

    const currentConfig = stepConfig[step];

    // Adjust text position for small screens (9:16)
    const isSmallScreen = window.innerHeight > window.innerWidth * 1.5;
    const padding = 20;

    let textStyle: React.CSSProperties = {
        left: '50%',
        width: '90%',
        maxWidth: '340px',
    };

    if (currentConfig.position === 'bottom') {
        const spaceBelow = window.innerHeight - targetRect.bottom;
        if (spaceBelow < 150 && isSmallScreen) {
            // Not enough space below, put it above
            textStyle.bottom = (window.innerHeight - targetRect.top) + 24;
        } else {
            textStyle.top = targetRect.bottom + 24;
        }
    } else {
        const spaceAbove = targetRect.top;
        if (spaceAbove < 150 && isSmallScreen) {
            // Not enough space above, put it below
            textStyle.top = targetRect.bottom + 24;
        } else {
            textStyle.bottom = (window.innerHeight - targetRect.top) + 24;
        }
    }

    return (
        <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden font-display">
            {/* 4-Rect Blocking Overlay (allows clicks in the hole) */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top */}
                <div
                    className="absolute top-0 left-0 right-0 bg-black/75 pointer-events-auto"
                    style={{ height: targetRect.top - 4 }}
                />
                {/* Bottom */}
                <div
                    className="absolute bottom-0 left-0 right-0 bg-black/75 pointer-events-auto"
                    style={{ height: window.innerHeight - (targetRect.bottom + 4) }}
                />
                {/* Left */}
                <div
                    className="absolute left-0 bg-black/75 pointer-events-auto"
                    style={{
                        top: targetRect.top - 4,
                        bottom: window.innerHeight - (targetRect.bottom + 4),
                        width: targetRect.left - 4
                    }}
                />
                {/* Right */}
                <div
                    className="absolute right-0 bg-black/75 pointer-events-auto"
                    style={{
                        top: targetRect.top - 4,
                        bottom: window.innerHeight - (targetRect.bottom + 4),
                        width: window.innerWidth - (targetRect.right + 4)
                    }}
                />
            </div>

            {/* Floating Text */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.9, x: "-50%" }}
                    animate={{ opacity: 1, scale: 1, x: "-50%" }}
                    exit={{ opacity: 0, scale: 0.9, x: "-50%" }}
                    className="absolute text-center z-[9999] flex flex-col items-center"
                    style={textStyle}
                >
                    <div className="bg-black/90 backdrop-blur-md border-4 border-yellow-400 rounded-[24px] px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.6)]">
                      <p
                          className="text-lg sm:text-xl md:text-2xl font-black text-yellow-400 leading-tight uppercase tracking-tight"
                          style={{ textWrap: 'balance' } as any}
                      >
                          {currentConfig.text}
                      </p>
                    </div>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-yellow-400 mt-6 text-4xl font-bold"
                    >
                        {textStyle.top ? '↑' : '↓'}
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Pulse Effect for the target element (Visual feedback) */}
            <div
                className="absolute border-4 border-yellow-400 rounded-xl animate-pulse pointer-events-none z-[10000]"
                style={{
                    left: targetRect.left - 8,
                    top: targetRect.top - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    boxShadow: '0 0 40px rgba(254,240,138,0.6), inset 0 0 20px rgba(254,240,138,0.4)',
                }}
            />
        </div>
    );
};
