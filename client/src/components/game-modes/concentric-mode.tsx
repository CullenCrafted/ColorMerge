import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameSettings } from "@/lib/game-engine";
import { Button } from "@/components/ui/button";
import { Heart, Pause } from "lucide-react";

interface ConcentricModeProps {
  gameSettings: GameSettings;
  onComplete: (success: boolean, score: number) => void;
  onGameOver: () => void;
}

interface Ring {
  id: number;
  radius: number;
  targetColor: string;
  currentColor: string;
  isMatched: boolean;
  colorClicks: { [key: string]: number };
}

export default function ConcentricMode({ gameSettings, onComplete, onGameOver }: ConcentricModeProps) {
  const [rings, setRings] = useState<Ring[]>([]);
  const [selectedRing, setSelectedRing] = useState<number | null>(null);
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [currentRingIndex, setCurrentRingIndex] = useState(0);

  const settings = gameSettings.settings;
  const colors = ['blue', 'red', 'yellow', 'white', 'black'];
  
  const colorValues = {
    blue: 'rgb(59, 130, 246)',
    red: 'rgb(239, 68, 68)',
    yellow: 'rgb(251, 191, 36)',
    white: 'rgb(255, 255, 255)',
    black: 'rgb(0, 0, 0)'
  };

  // Generate random target colors
  const generateTargetColor = () => {
    const colorCombinations = [
      { blue: 1, red: 0, yellow: 0, white: 0, black: 0 },
      { blue: 0, red: 1, yellow: 0, white: 0, black: 0 },
      { blue: 0, red: 0, yellow: 1, white: 0, black: 0 },
      { blue: 1, red: 1, yellow: 0, white: 0, black: 0 },
      { blue: 0, red: 1, yellow: 1, white: 0, black: 0 },
      { blue: 1, red: 0, yellow: 1, white: 0, black: 0 },
      { blue: 1, red: 1, yellow: 1, white: 0, black: 0 },
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

  // Initialize rings
  useEffect(() => {
    const newRings: Ring[] = [];
    const ringCount = settings.rings || 4;
    const maxRadius = 140;
    
    for (let i = 0; i < ringCount; i++) {
      const radius = maxRadius - (i * (maxRadius / ringCount));
      const targetColorClicks = generateTargetColor();
      const targetColor = mixColors(targetColorClicks);
      
      newRings.push({
        id: i,
        radius,
        targetColor,
        currentColor: 'rgba(200, 200, 200, 0.5)',
        isMatched: false,
        colorClicks: { blue: 0, red: 0, yellow: 0, white: 0, black: 0 }
      });
    }
    
    setRings(newRings);
    setSelectedRing(0); // Start with the innermost ring
  }, [settings]);

  const handleColorClick = (color: string) => {
    if (selectedRing === null || isPaused) return;

    setRings(prev => prev.map(ring => {
      if (ring.id === selectedRing && !ring.isMatched) {
        const newColorClicks = { ...ring.colorClicks };
        newColorClicks[color] = (newColorClicks[color] || 0) + 1;
        const newColor = mixColors(newColorClicks);
        
        // Check if color matches target (with some tolerance)
        const colorDistance = getColorDistance(newColor, ring.targetColor);
        const isMatched = colorDistance < (settings.blend_precision || 0.2) * 100;
        
        if (isMatched) {
          setScore(prev => prev + 200 * (ring.id + 1)); // More points for outer rings
        }
        
        return {
          ...ring,
          colorClicks: newColorClicks,
          currentColor: newColor,
          isMatched
        };
      }
      return ring;
    }));
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

  // Auto-advance to next ring when current is matched
  useEffect(() => {
    const currentRing = rings.find(r => r.id === selectedRing);
    if (currentRing?.isMatched) {
      const nextRingIndex = selectedRing! + 1;
      if (nextRingIndex < rings.length) {
        setSelectedRing(nextRingIndex);
      }
    }
  }, [rings, selectedRing]);

  // Check for level completion
  useEffect(() => {
    const matchedRings = rings.filter(r => r.isMatched).length;
    if (rings.length > 0 && matchedRings === rings.length) {
      onComplete(true, score);
    }
  }, [rings, score, onComplete]);

  const handleRingClick = (ringId: number) => {
    if (isPaused || rings.find(r => r.id === ringId)?.isMatched) return;
    setSelectedRing(ringId);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
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
          <div className="text-lg font-semibold text-white">
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

      {/* Concentric Circles */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-80 h-80">
          <svg className="w-full h-full" viewBox="0 0 320 320">
            {rings.map((ring, index) => (
              <motion.circle
                key={ring.id}
                cx="160"
                cy="160"
                r={ring.radius}
                fill={ring.isMatched ? 'transparent' : ring.currentColor}
                stroke={selectedRing === ring.id ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)'}
                strokeWidth={selectedRing === ring.id ? '4' : '2'}
                onClick={() => handleRingClick(ring.id)}
                className="cursor-pointer transition-all duration-300"
                animate={{
                  opacity: ring.isMatched ? 0 : 1,
                  scale: selectedRing === ring.id ? 1.05 : 1
                }}
                transition={{ duration: 0.3 }}
                style={{
                  filter: selectedRing === ring.id ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.6))' : 'none'
                }}
              />
            ))}
            
            {/* Ring labels */}
            {rings.map(ring => (
              <text
                key={`label-${ring.id}`}
                x="160"
                y={160 - ring.radius + 15}
                textAnchor="middle"
                className="text-sm font-medium fill-white opacity-60"
              >
                {ring.id + 1}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Selected Ring Info */}
      {selectedRing !== null && (
        <div className="px-4 mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
            <p className="text-sm text-white/80 mb-2">Ring {selectedRing + 1} Target Color:</p>
            <div 
              className="w-12 h-12 mx-auto rounded-full border-2 border-white/40 mb-2"
              style={{ backgroundColor: rings.find(r => r.id === selectedRing)?.targetColor }}
            />
            <p className="text-xs text-white/60">Match from inside out</p>
          </div>
        </div>
      )}

      {/* Color Palette */}
      <div className="pb-8 px-4">
        <div className="flex justify-center space-x-4">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => handleColorClick(color)}
              disabled={selectedRing === null || isPaused}
              className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 disabled:opacity-50"
              style={{ backgroundColor: colorValues[color as keyof typeof colorValues] }}
            />
          ))}
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