import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameMode } from "@/lib/game-engine";

interface GameModeTransitionProps {
  gameMode: GameMode;
  level: number;
  onComplete: () => void;
  show: boolean;
}

export default function GameModeTransition({ gameMode, level, onComplete, show }: GameModeTransitionProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!show) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, onComplete]);

  const getModeDisplayName = (mode: GameMode) => {
    const displayNames = {
      Classic: "Classic Mode",
      GolfBall: "Golf Ball Mode", 
      Strings: "Strings Mode",
      Concentric: "Concentric Mode",
      FlashBG: "Flash Background Mode",
      Tetris: "Tetris Mode",
      Chaotic: "Chaotic Mode",
      ZenFade: "Zen Fade Mode"
    };
    return displayNames[mode] || mode;
  };

  const getModeColor = (mode: GameMode) => {
    const colors = {
      Classic: "from-blue-400 via-purple-500 to-pink-500",
      GolfBall: "from-gray-100 via-white to-gray-200",
      Strings: "from-pink-400 via-red-500 to-orange-500",
      Concentric: "from-indigo-400 via-purple-500 to-pink-500",
      FlashBG: "from-yellow-400 via-red-500 to-purple-600",
      Tetris: "from-green-400 via-teal-500 to-blue-500",
      Chaotic: "from-gray-700 via-gray-800 to-black",
      ZenFade: "from-teal-400 via-cyan-500 to-blue-500"
    };
    return colors[mode] || "from-blue-400 to-purple-500";
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br ${getModeColor(gameMode)}`}
        >
          <div className="text-center text-white">
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-bold mb-4"
            >
              {getModeDisplayName(gameMode)}
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl mb-8 opacity-80"
            >
              Level {level}
            </motion.p>

            {countdown > 0 ? (
              <motion.div
                key={countdown}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-8xl font-bold"
              >
                {countdown}
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold"
              >
                START!
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}