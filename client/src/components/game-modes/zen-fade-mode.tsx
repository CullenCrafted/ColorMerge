import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameSettings } from "@/lib/game-engine";
import { Button } from "@/components/ui/button";
import { Heart, Pause, Clock } from "lucide-react";

interface ZenFadeModeProps {
  gameSettings: GameSettings;
  onComplete: (success: boolean, score: number) => void;
  onGameOver: () => void;
}

export default function ZenFadeMode({ gameSettings, onComplete, onGameOver }: ZenFadeModeProps) {
  const [currentTargetColor, setCurrentTargetColor] = useState('rgb(128, 128, 128)');
  const [nextTargetColor, setNextTargetColor] = useState('rgb(180, 180, 180)');
  const [playerColor, setPlayerColor] = useState('rgb(128, 128, 128)');
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [colorClicks, setColorClicks] = useState<{ [key: string]: number }>({
    blue: 0, red: 0, yellow: 0, white: 0, black: 0
  });
  const [fadeProgress, setFadeProgress] = useState(0);
  const [completedTransitions, setCompletedTransitions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const fadeIntervalRef = useRef<NodeJS.Timeout>();
  const targetTransitions = 8;

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
      { blue: 2, red: 1, yellow: 0, white: 1, black: 0 },
      { blue: 1, red: 2, yellow: 1, white: 0, black: 0 },
      { blue: 0, red: 1, yellow: 2, white: 1, black: 0 },
      { blue: 1, red: 1, yellow: 1, white: 1, black: 0 },
      { blue: 2, red: 0, yellow: 1, white: 1, black: 0 },
      { blue: 1, red: 2, yellow: 0, white: 0, black: 1 },
      { blue: 0, red: 1, yellow: 1, white: 0, black: 1 },
      { blue: 1, red: 0, yellow: 1, white: 1, black: 1 },
    ];
    return colorCombinations[Math.floor(Math.random() * colorCombinations.length)];
  };

  // Mix colors to get RGB
  const mixColors = (colorClicks: { [key: string]: number }) => {
    let r = 128, g = 128, b = 128;
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

  // Interpolate between two colors
  const interpolateColor = (color1: string, color2: string, progress: number) => {
    const rgb1 = color1.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)?.slice(1).map(Number) || [0, 0, 0];
    const rgb2 = color2.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)?.slice(1).map(Number) || [0, 0, 0];
    
    const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * progress);
    const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * progress);
    const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * progress);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Initialize colors
  useEffect(() => {
    const currentColorClicks = generateTargetColor();
    const nextColorClicks = generateTargetColor();
    
    setCurrentTargetColor(mixColors(currentColorClicks));
    setNextTargetColor(mixColors(nextColorClicks));
    setPlayerColor('rgb(128, 128, 128)');
    setColorClicks({ blue: 0, red: 0, yellow: 0, white: 0, black: 0 });
    
    startFadeTransition();
  }, []);

  const startFadeTransition = () => {
    setFadeProgress(0);
    setTimeLeft(100);
    
    const fadeDuration = (settings.fade_duration || 10) * 1000; // Convert to milliseconds
    const updateInterval = 50; // Update every 50ms for smooth animation
    const progressIncrement = updateInterval / fadeDuration;
    
    fadeIntervalRef.current = setInterval(() => {
      if (isPaused) return;
      
      setFadeProgress(prev => {
        const newProgress = prev + progressIncrement;
        if (newProgress >= 1) {
          // Transition complete - check if player matched
          checkMatch();
          return 1;
        }
        return newProgress;
      });
      
      setTimeLeft(prev => Math.max(0, prev - (100 * progressIncrement)));
    }, updateInterval);
  };

  const checkMatch = () => {
    // Stop the current fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    // Get the final fade color (what the player was supposed to match)
    const finalFadeColor = nextTargetColor;
    const colorDistance = getColorDistance(playerColor, finalFadeColor);
    const tolerance = (settings.precision_required || 0.2) * 100;
    
    if (colorDistance < tolerance) {
      // Success!
      const timeBonus = Math.floor(timeLeft * 2);
      setScore(prev => prev + 200 + timeBonus);
      setCompletedTransitions(prev => {
        const newCount = prev + 1;
        if (newCount >= targetTransitions) {
          setTimeout(() => onComplete(true, score + 200 + timeBonus), 1000);
          return newCount;
        }
        
        // Start next transition
        setTimeout(startNextTransition, 1000);
        return newCount;
      });
    } else {
      // Failed to match
      setHearts(prev => {
        const newHearts = prev - 1;
        if (newHearts <= 0) {
          setTimeout(() => onGameOver(), 1000);
        } else {
          // Try again with same colors
          setTimeout(startFadeTransition, 1000);
        }
        return newHearts;
      });
    }
  };

  const startNextTransition = () => {
    // Move next color to current, generate new next color
    setCurrentTargetColor(nextTargetColor);
    const newNextColorClicks = generateTargetColor();
    setNextTargetColor(mixColors(newNextColorClicks));
    
    // Reset player state
    setPlayerColor('rgb(128, 128, 128)');
    setColorClicks({ blue: 0, red: 0, yellow: 0, white: 0, black: 0 });
    
    // Start new fade
    startFadeTransition();
  };

  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const handleColorClick = (color: string) => {
    if (isPaused || fadeProgress >= 1) return;

    const newColorClicks = { ...colorClicks };
    newColorClicks[color] = (newColorClicks[color] || 0) + 1;
    setColorClicks(newColorClicks);
    
    const newColor = mixColors(newColorClicks);
    setPlayerColor(newColor);
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

  const resetColors = () => {
    setPlayerColor('rgb(128, 128, 128)');
    setColorClicks({ blue: 0, red: 0, yellow: 0, white: 0, black: 0 });
  };

  // Get current fade color
  const currentFadeColor = interpolateColor(currentTargetColor, nextTargetColor, fadeProgress);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Animated background showing the fade */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: currentFadeColor }}
        transition={{ duration: 0.1 }}
      />

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
          <div className="text-sm text-white/80 drop-shadow">
            Transitions: {completedTransitions}/{targetTransitions}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-black/20 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-white" />
            <div className="text-white font-mono text-sm">
              {Math.ceil(timeLeft)}%
            </div>
          </div>
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

      {/* Progress Bar */}
      <div className="px-4 mb-4">
        <div className="bg-black/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-white/60"
            style={{ width: `${fadeProgress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        {/* Color comparison */}
        <div className="flex items-center space-x-8">
          <div className="text-center">
            <p className="text-white/80 text-sm mb-2 drop-shadow">Target Fade</p>
            <div 
              className="w-24 h-24 rounded-full border-4 border-white/50 shadow-2xl"
              style={{ backgroundColor: currentFadeColor }}
            />
          </div>
          
          <div className="text-white/60 text-4xl">→</div>
          
          <div className="text-center">
            <p className="text-white/80 text-sm mb-2 drop-shadow">Your Color</p>
            <div 
              className="w-24 h-24 rounded-full border-4 border-white/50 shadow-2xl"
              style={{ backgroundColor: playerColor }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-lg">
            Follow the Zen Fade
          </h3>
          <p className="text-white/80 text-sm drop-shadow">
            Match your color to the slowly changing background.
            Stay mindful and blend with the flow.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={resetColors}
            variant="outline"
            className="border-white/50 text-white hover:bg-white/20 drop-shadow-lg"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Color Palette */}
      <div className="pb-8 px-4">
        <div className="flex justify-center space-x-4 mb-4">
          {colors.map(color => {
            const count = colorClicks[color] || 0;
            return (
              <div key={color} className="flex flex-col items-center">
                <button
                  onClick={() => handleColorClick(color)}
                  disabled={isPaused || fadeProgress >= 1}
                  className="w-14 h-14 rounded-full border-2 border-white/50 shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 disabled:opacity-50"
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