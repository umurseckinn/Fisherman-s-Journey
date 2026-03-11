import { motion } from "framer-motion";
import { Gift, Check } from "lucide-react";

interface WelcomeGiftModalProps {
    onClaim: () => void;
}

export function WelcomeGiftModal({ onClaim }: WelcomeGiftModalProps) {
    const boosters = [
        { name: "Harpoon", img: "/assets/boosters/harpoon.png" },
        { name: "Net", img: "/assets/boosters/net.png" },
        { name: "TNT", img: "/assets/boosters/tnt.png" },
        { name: "Anchor", img: "/assets/boosters/the_anchor.png" },
    ];

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-gradient-to-b from-sky-400 to-blue-600 rounded-[40px] p-8 max-w-sm w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white/30 relative overflow-hidden"
            >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -rotate-45 translate-x-1/2 pointer-events-none" />

                <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white"
                >
                    <Gift className="w-12 h-12 text-blue-700 fill-blue-700/20" />
                </motion.div>

                <h2 className="text-4xl font-display font-black text-white mb-2 drop-shadow-lg">WELCOME GIFT!</h2>
                <p className="text-sky-100 font-medium mb-8">
                    You've reached Level 2!<br />
                    Enjoy 2 of each booster on us!
                </p>

                <div className="grid grid-cols-4 gap-3 mb-10">
                    {boosters.map((booster, idx) => (
                        <motion.div
                            key={booster.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl p-2 border border-white/30 shadow-inner group transition-transform hover:scale-110">
                                <img src={booster.img} alt={booster.name} className="w-full h-full object-contain filter drop-shadow-md" />
                                <div className="absolute -top-2 -right-2 bg-yellow-400 text-blue-800 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                    +2
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClaim}
                    className="w-full bg-white text-blue-600 py-5 px-8 rounded-2xl font-display font-black text-xl shadow-[0_8px_0_rgb(200,200,200)] hover:shadow-[0_4px_0_rgb(200,200,200)] hover:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                >
                    CLAIM NOW
                    <Check className="w-6 h-6" />
                </motion.button>
            </motion.div>
        </div>
    );
}
