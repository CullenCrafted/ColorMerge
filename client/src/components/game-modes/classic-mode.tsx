import { useState, useEffect } from "react";  
import { GameSettings } from "@/lib/game-engine";
import { ColorMergeLogic } from "@/lib/colormerge-logic";
import { Button } from "@/components/ui/button";
import { Heart, RotateCcw, Pause, Volume2, VolumeX } from "lucide-react";

// Helper function to calculate color distance
const colorDistance = (color1: {r: number, g: number, b: number}, color2: {r: number, g: number, b: number}) => {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) + 
    Math.pow(color1.b - color2.b, 2)
  );
};

interface ClassicModeProps {
  gameSettings: GameSettings;
  onComplete: (success: boolean, score: number) => void;
  onGameOver: () => void;
}

export default function ClassicMode({ gameSettings, onComplete, onGameOver }: ClassicModeProps) {
  const [gameLogic] = useState(() => new ColorMergeLogic(gameSettings.level, 3));
  const [gameState, setGameState] = useState(gameLogic.getState());
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const state = gameLogic.getState();
    setGameState(state);
  }, [gameLogic]);

  const handleColorClick = (color: string) => {
    if (isPaused) return;
    
    const result = gameLogic.addColor(color);
    const newState = gameLogic.getState();
    setGameState(newState);

    // Check if level is complete (target matches current color within tolerance)
    const isComplete = colorDistance(newState.currentColor, newState.targetColor) < 10;
    if (isComplete) {
      onComplete(true, 1000);
    } else if (newState.hearts <= 0) {
      onGameOver();
    }
  };

  const resetLevel = () => {
    // Reset color clicks
    const newLogic = new ColorMergeLogic(gameSettings.level, gameState.hearts);
    setGameState(newLogic.getState());
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const colors = ['blue', 'red', 'yellow', 'white', 'black'];
  const targetColor = `rgb(${Math.round(gameState.targetColor.r)}, ${Math.round(gameState.targetColor.g)}, ${Math.round(gameState.targetColor.b)})`;
  const backgroundColor = `rgb(${Math.round(gameState.currentColor.r)}, ${Math.round(gameState.currentColor.g)}, ${Math.round(gameState.currentColor.b)})`;

  // Calculate text color based on background brightness
  const getContrastTextColor = (backgroundColor: string): string => {
    const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return 'text-white';
    
    const [, r, g, b] = rgbMatch.map(Number);
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    
    return brightness > 128 ? 'text-black' : 'text-white';
  };

  const textColorClass = getContrastTextColor(backgroundColor);

  return (
    <div 
      className="h-screen flex flex-col relative overflow-hidden transition-all duration-700 ease-in-out"
      style={{ backgroundColor }}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-6 h-6 ${
                  i < gameState.hearts
                    ? 'text-red-500 fill-red-500'
                    : 'text-gray-400'
                }`}
              />
            ))}
          </div>
          <div className={`text-lg font-semibold ${textColorClass}`}>
            Level {gameState.currentLevel}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 ${textColorClass}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetLevel}
            className={`p-2 ${textColorClass}`}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePause}
            className={`p-2 ${textColorClass}`}
          >
            <Pause className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Target Color Display */}
      <div className="px-4 mb-4">
        <div className="text-center">
          <p className={`text-sm mb-2 ${textColorClass} opacity-80`}>Target Color:</p>
          <div 
            className="w-20 h-20 mx-auto rounded-full border-4 border-white/50 shadow-lg"
            style={{ backgroundColor: targetColor }}
          />
        </div>
      </div>

      {/* Color Palette */}
      <div className="flex-1 flex items-end justify-center pb-8">
        <div className="grid grid-cols-5 gap-4 px-4">
          {colors.map((color) => {
            const colorValue = {
              blue: 'rgb(59, 130, 246)',
              red: 'rgb(239, 68, 68)', 
              yellow: 'rgb(251, 191, 36)',
              white: 'rgb(255, 255, 255)',
              black: 'rgb(0, 0, 0)'
            }[color];

            const count = gameState.colorClicks[color] || 0;

            return (
              <div key={color} className="flex flex-col items-center">
                <button
                  onClick={() => handleColorClick(color)}
                  disabled={isPaused}
                  className="w-16 h-16 rounded-full border-4 border-white/50 shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 disabled:opacity-50"
                  style={{ backgroundColor: colorValue }}
                />
                {count > 0 && (
                  <div className={`mt-2 text-sm font-semibold ${textColorClass} bg-black/20 px-2 py-1 rounded-full`}>
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
            <Button onClick={togglePause} size="lg">
              Resume
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}