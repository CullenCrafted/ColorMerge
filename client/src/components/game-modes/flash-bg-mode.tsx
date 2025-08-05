import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameSettings } from "@/lib/game-engine";
import { Button } from "@/components/ui/button";
import { Heart, Pause, Eye, EyeOff } from "lucide-react";

interface FlashBGModeProps {
  gameSettings: GameSettings;
  onComplete: (success: boolean, score: number) => void;
  onGameOver: () => void;
}

export default function FlashBGMode({ gameSettings, onComplete, onGameOver }: FlashBGModeProps) {
  const [targetColor, setTargetColor] = useState('rgb(128, 128, 128)');
  const [currentColor, setCurrentColor] = useState('rgb(128, 128, 128)');
  const [showTarget, setShowTarget] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [colorClicks, setColorClicks] = useState<{ [key: string]: number }>({
    blue: 0, red: 0, yellow: 0, white: 0, black: 0
  });
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<'countdown' | 'flash' | 'recreate' | 'result'>('countdown');
  const flashTimeoutRef = useRef<NodeJS.Timeout>();

  const settings = gameSettings.settings;
  const colors = ['blue', 'red', 'yellow', 'white', 'black'];
  
  const colorValues = {
    blue: 'rgb(59, 130, 246)',
    red: 'rgb(239, 68, 68)',
    yellow: 'rgb(251, 191, 36)',
    white: 'rgb(255, 255, 255)',
    black: 'rgb(0, 0, 0)'
  };

  // Generate random target color
  const generateTargetColor = () => {
    const colorCombinations = [
      { blue: 2, red: 1, yellow: 0, white: 0, black: 0 },
      { blue: 0, red: 2, yellow: 1, white: 0, black: 0 },
      { blue: 1, red: 0, yellow: 2, white: 0, black: 0 },
      { blue: 1, red: 1, yellow: 1, white: 0, black: 0 },
      { blue: 2, red: 1, yellow: 1, white: 0, black: 0 },
      { blue: 1, red: 2, yellow: 1, white: 0, black: 0 },
      { blue: 1, red: 1, yellow: 2, white: 0, black: 0 },
      { blue: 2, red: 2, yellow: 1, white: 0, black: 0 },
    ];
    return colorCombinations[Math.floor(Math.random() * colorCombinations.length)];
  };

  // Mix colors to get RGB
  const mixColors = (colorClicks: { [key: string]: number }) => {
    let r = 128, g = 128, b = 128; // Start with gray base
    let totalClicks = Object.values(colorClicks).reduce((sum, count) => sum + count, 0);
    
    if (totalClicks === 0) return `rgb(${r}, ${g}, ${b})`;

    Object.entries(colorClicks).forEach(([color, count]) => {
      const weight = count / totalClicks;
      if (color === 'blue') { r += (59 - r) * weight; g += (130 - g) * weight; b += (246 - b) * weight; }
      if (color === 'red') { r += (239 - r) * weight; g += (68 - g) * weight; b += (68 - b) * weight; }
      if (color === 'yellow') { r += (251 - r) * weight; g += (191 - g) * weight; b += (36 - b) * weight; }
      if (color === 'white') { r += (255 - r) * weight; g += (255 - g) * weight; b += (255 - b) * weight; }
      if (color === 'black') { r += (0 - r) * weight; g += (0 - g) * weight; b += (0 - b) * weight; }
    });

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  // Initialize game
  useEffect(() => {
    const targetColorClicks = generateTargetColor();
    const target = mixColors(targetColorClicks);
    setTargetColor(target);
    setCurrentColor('rgb(128, 128, 128)');
    setColorClicks({ blue: 0, red: 0, yellow: 0, white: 0, black: 0 });
    startCountdown();
  }, []);

  const startCountdown = () => {
    setPhase('countdown');
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startFlash();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startFlash = () => {
    setPhase('flash');
    setShowTarget(true);
    
    flashTimeoutRef.current = setTimeout(() => {
      setShowTarget(false);
      setPhase('recreate');
      setIsRecreating(true);
    }, (settings.flash_duration || 2) * 1000);
  };

  const handleColorClick = (color: string) => {
    if (phase !== 'recreate' || isPaused) return;

    const newColorClicks = { ...colorClicks };
    newColorClicks[color] = (newColorClicks[color] || 0) + 1;
    setColorClicks(newColorClicks);
    
    const newColor = mixColors(newColorClicks);
    setCurrentColor(newColor);
  };

  const getColorDistance = (color1: string, color2: string) => {
    const rgb1 = color1.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)?.slice(1).map(Number) || [0, 0, 0];
    const rgb2 = color2.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)?.slice(1).map(Number) || [0, 0, 0];
    
    return Math.sqrt(
      Math.pow(rgb1[0] - rgb2[0], 2) +
      Math.pow(rgb1[1] - rgb2[1], 2) +
      Math.pow(rgb1[2] - rgb2[2], 2)
    );
  };

  const checkResult = () => {
    const colorDistance = getColorDistance(currentColor, targetColor);
    const tolerance = (settings.pattern_complexity || 0.3) * 100;
    const isMatch = colorDistance < tolerance;
    
    if (isMatch) {
      setScore(prev => prev + Math.max(100, 500 - Math.floor(colorDistance)));
      onComplete(true, score + Math.max(100, 500 - Math.floor(colorDistance)));
    } else {
      setHearts(prev => {
        const newHearts = prev - 1;
        if (newHearts <= 0) {
          onGameOver();
        }
        return newHearts;
      });
      // Reset for next attempt
      setTimeout(() => {
        const newTargetClicks = generateTargetColor();
        const newTarget = mixColors(newTargetClicks);
        setTargetColor(newTarget);
        setCurrentColor('rgb(128, 128, 128)');
        setColorClicks({ blue: 0, red: 0, yellow: 0, white: 0, black: 0 });
        startCountdown();
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const resetColors = () => {
    setCurrentColor('rgb(128, 128, 128)');
    setColorClicks({ blue: 0, red: 0, yellow: 0, white: 0, black: 0 });
  };

  return (
    <div 
      className="h-screen flex flex-col relative overflow-hidden transition-all duration-300"
      style={{ 
        backgroundColor: showTarget ? targetColor : currentColor
      }}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-6 h-6 ${
                  i < hearts ? 'text-red-500 fill-red-500' : 'text-gray-400'
                }`}
              />
            ))}
          </div>
          <div className="text-lg font-semibold text-white drop-shadow-lg">
            Level {gameSettings.level} • Score: {score}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-white"
          >
            <Pause className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-white drop-shadow-2xl mb-4">
                {countdown > 0 ? countdown : 'WATCH!'}
              </div>
              <p className="text-xl text-white/80 drop-shadow-lg">
                Remember the background color...
              </p>
            </motion.div>
          )}

          {phase === 'flash' && (
            <motion.div
              key="flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center text-white drop-shadow-2xl">
                <Eye className="w-16 h-16" />
              </div>
              <p className="text-xl text-white/80 drop-shadow-lg mt-4">
                Memorizing...
              </p>
            </motion.div>
          )}

          {phase === 'recreate' && (
            <motion.div
              key="recreate"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center text-white drop-shadow-2xl mb-4">
                <EyeOff className="w-16 h-16" />
              </div>
              <p className="text-xl text-white/80 drop-shadow-lg mb-6">
                Recreate the color from memory
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={checkResult}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
                >
                  Submit
                </Button>
                <Button
                  onClick={resetColors}
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 px-6 py-2"
                >
                  Reset
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Color Palette */}
      {phase === 'recreate' && (
        <div className="pb-8 px-4">
          <div className="flex justify-center space-x-4 mb-4">
            {colors.map(color => {
              const count = colorClicks[color] || 0;
              return (
                <div key={color} className="flex flex-col items-center">
                  <button
                    onClick={() => handleColorClick(color)}
                    disabled={isPaused}
                    className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 disabled:opacity-50"
                    style={{ backgroundColor: colorValues[color as keyof typeof colorValues] }}
                  />
                  {count > 0 && (
                    <div className="mt-1 text-sm font-semibold text-white bg-black/30 px-2 py-1 rounded-full">
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Game Paused</h3>
            <Button onClick={() => setIsPaused(false)} size="lg">
              Resume
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}