import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameSettings } from "@/lib/game-engine";
import { Button } from "@/components/ui/button";
import { Heart, RotateCcw, Pause } from "lucide-react";

interface StringsModeProps {
  gameSettings: GameSettings;
  onComplete: (success: boolean, score: number) => void;
  onGameOver: () => void;
}

interface Band {
  id: number;
  path: string;
  strokeWidth: number;
  color: string;
  targetColor: string;
  isMatched: boolean;
  colorClicks: { [key: string]: number };
  curvature: number;
}

export default function StringsMode({ gameSettings, onComplete, onGameOver }: StringsModeProps) {
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBand, setSelectedBand] = useState<number | null>(null);
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [backgroundColor] = useState('rgb(45, 55, 72)');

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
      { blue: 2, red: 1, yellow: 0, white: 0, black: 0 },
      { blue: 0, red: 2, yellow: 1, white: 0, black: 0 },
      { blue: 1, red: 0, yellow: 2, white: 0, black: 0 },
      { blue: 1, red: 1, yellow: 1, white: 0, black: 0 },
      { blue: 1, red: 1, yellow: 0, white: 1, black: 0 },
      { blue: 0, red: 1, yellow: 1, white: 1, black: 0 },
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

  // Generate SVG path for curved band
  const generateBandPath = (curvature: number, index: number, total: number) => {
    const width = 400;
    const height = 600;
    const spacing = height / (total + 1);
    const y = spacing * (index + 1);
    
    const startX = 50;
    const endX = width - 50;
    const controlY = y + (curvature * 100) * (Math.random() - 0.5);
    
    return `M ${startX} ${y} Q ${width/2} ${controlY} ${endX} ${y}`;
  };

  // Initialize bands
  useEffect(() => {
    const newBands: Band[] = [];
    const bandCount = settings.bands || 4;
    
    for (let i = 0; i < bandCount; i++) {
      const curvature = (settings.curvature || 1) * (Math.random() - 0.5);
      const targetColorClicks = generateTargetColor();
      const targetColor = mixColors(targetColorClicks);
      const strokeWidth = 8 + Math.random() * (settings.width_variance || 0.5) * 16;
      
      newBands.push({
        id: i,
        path: generateBandPath(curvature, i, bandCount),
        strokeWidth,
        color: 'rgba(100, 100, 100, 0.8)', // Default band color
        targetColor,
        isMatched: false,
        colorClicks: { blue: 0, red: 0, yellow: 0, white: 0, black: 0 },
        curvature
      });
    }
    
    setBands(newBands);
  }, [settings]);

  const handleColorClick = (color: string) => {
    if (selectedBand === null || isPaused) return;

    setBands(prev => prev.map(band => {
      if (band.id === selectedBand && !band.isMatched) {
        const newColorClicks = { ...band.colorClicks };
        newColorClicks[color] = (newColorClicks[color] || 0) + 1;
        const newColor = mixColors(newColorClicks);
        
        // Check if color matches target (with some tolerance)
        const colorDistance = getColorDistance(newColor, band.targetColor);
        const isMatched = colorDistance < (settings.overlap_complexity || 0.3) * 150;
        
        if (isMatched) {
          setScore(prev => prev + 150);
        }
        
        return {
          ...band,
          colorClicks: newColorClicks,
          color: newColor,
          isMatched
        };
      }
      return band;
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

  // Check for level completion
  useEffect(() => {
    const matchedBands = bands.filter(b => b.isMatched).length;
    if (bands.length > 0 && matchedBands === bands.length) {
      onComplete(true, score);
    }
  }, [bands, score, onComplete]);

  const handleBandClick = (bandId: number) => {
    if (isPaused) return;
    setSelectedBand(bandId === selectedBand ? null : bandId);
  };

  return (
    <div 
      className="h-screen flex flex-col relative overflow-hidden"
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

      {/* Bands Canvas */}
      <div className="flex-1 relative">
        <svg className="w-full h-full" viewBox="0 0 400 600">
          {bands.map(band => (
            <motion.path
              key={band.id}
              d={band.path}
              stroke={band.isMatched ? 'transparent' : band.color}
              strokeWidth={band.strokeWidth}
              fill="none"
              strokeLinecap="round"
              onClick={() => handleBandClick(band.id)}
              className={`cursor-pointer transition-all duration-300 ${
                selectedBand === band.id ? 'filter drop-shadow-lg' : ''
              }`}
              style={{
                filter: selectedBand === band.id ? 'drop-shadow(0 0 10px yellow)' : 'none'
              }}
              animate={{
                strokeWidth: selectedBand === band.id ? band.strokeWidth * 1.2 : band.strokeWidth,
                opacity: band.isMatched ? 0 : 1
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
          
          {/* Selection highlight */}
          {selectedBand !== null && (
            <motion.path
              d={bands.find(b => b.id === selectedBand)?.path || ''}
              stroke="yellow"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </svg>
      </div>

      {/* Selected Band Info */}
      {selectedBand !== null && (
        <div className="px-4 mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
            <p className="text-sm text-white/80 mb-2">Target Color:</p>
            <div 
              className="w-12 h-12 mx-auto rounded-full border-2 border-white/40 mb-2"
              style={{ backgroundColor: bands.find(b => b.id === selectedBand)?.targetColor }}
            />
            <p className="text-xs text-white/60">Tap colors below to blend</p>
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
              disabled={selectedBand === null || isPaused}
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