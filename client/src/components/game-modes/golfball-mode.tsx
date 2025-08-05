import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GameSettings } from "@/lib/game-engine";
import { Button } from "@/components/ui/button";
import { Heart, RotateCcw, Pause } from "lucide-react";

interface GolfBallModeProps {
  gameSettings: GameSettings;
  onComplete: (success: boolean, score: number) => void;
  onGameOver: () => void;
}

interface Dimple {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
  targetColor: string;
  isMatched: boolean;
  colorClicks: { [key: string]: number };
}

export default function GolfBallMode({ gameSettings, onComplete, onGameOver }: GolfBallModeProps) {
  const [dimples, setDimples] = useState<Dimple[]>([]);
  const [selectedDimple, setSelectedDimple] = useState<number | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const rotationRef = useRef({ x: 0, y: 0 });

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

  // Initialize dimples
  useEffect(() => {
    const newDimples: Dimple[] = [];
    const dimpleCount = settings.dimples || 20;
    
    for (let i = 0; i < dimpleCount; i++) {
      // Distribute dimples on sphere surface using spherical coordinates
      const phi = Math.acos(1 - 2 * Math.random()); // Inclination
      const theta = 2 * Math.PI * Math.random(); // Azimuth
      
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      const targetColorClicks = generateTargetColor();
      const targetColor = mixColors(targetColorClicks);
      
      newDimples.push({
        id: i,
        x, y, z,
        color: 'rgb(200, 200, 200)', // Default dimple color
        targetColor,
        isMatched: false,
        colorClicks: { blue: 0, red: 0, yellow: 0, white: 0, black: 0 }
      });
    }
    
    setDimples(newDimples);
  }, [settings]);

  // Auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        rotationRef.current.y += (settings.rotation_speed || 1) * 0.02;
        setRotation({ ...rotationRef.current });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, settings.rotation_speed]);

  const handleColorClick = (color: string) => {
    if (selectedDimple === null || isPaused) return;

    setDimples(prev => prev.map(dimple => {
      if (dimple.id === selectedDimple && !dimple.isMatched) {
        const newColorClicks = { ...dimple.colorClicks };
        newColorClicks[color] = (newColorClicks[color] || 0) + 1;
        const newColor = mixColors(newColorClicks);
        
        // Check if color matches target (with some tolerance)
        const colorDistance = getColorDistance(newColor, dimple.targetColor);
        const isMatched = colorDistance < (settings.blend_variance || 0.1) * 100;
        
        if (isMatched) {
          setScore(prev => prev + 100);
        }
        
        return {
          ...dimple,
          colorClicks: newColorClicks,
          color: newColor,
          isMatched
        };
      }
      return dimple;
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
    const matchedDimples = dimples.filter(d => d.isMatched).length;
    if (dimples.length > 0 && matchedDimples === dimples.length) {
      onComplete(true, score);
    }
  }, [dimples, score, onComplete]);

  const handleDimpleClick = (dimpleId: number) => {
    if (isPaused) return;
    setSelectedDimple(dimpleId === selectedDimple ? null : dimpleId);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-sky-100 to-indigo-200 relative overflow-hidden">
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
          <div className="text-lg font-semibold text-gray-800">
            Level {gameSettings.level} • Score: {score}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-gray-800"
          >
            <Pause className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Golf Ball */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-80 h-80">
          <motion.div
            className="w-full h-full relative"
            style={{
              transform: `rotateX(${rotation.x}rad) rotateY(${rotation.y}rad)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Ball surface */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-gray-300 shadow-2xl" />
            
            {/* Dimples */}
            {dimples.map(dimple => {
              // Project 3D coordinates to 2D screen position
              const rotatedX = dimple.x * Math.cos(rotation.y) - dimple.z * Math.sin(rotation.y);
              const rotatedZ = dimple.x * Math.sin(rotation.y) + dimple.z * Math.cos(rotation.y);
              const rotatedY = dimple.y * Math.cos(rotation.x) - rotatedZ * Math.sin(rotation.x);
              
              // Only show dimples on the front hemisphere
              if (rotatedZ < 0) return null;
              
              const screenX = (rotatedX * 120) + 160; // Center at 160px (half of 320px)
              const screenY = (rotatedY * 120) + 160;
              
              return (
                <button
                  key={dimple.id}
                  onClick={() => handleDimpleClick(dimple.id)}
                  className={`absolute w-8 h-8 rounded-full border-2 transition-all duration-200 transform -translate-x-4 -translate-y-4 ${
                    selectedDimple === dimple.id 
                      ? 'border-yellow-400 scale-125 z-10' 
                      : 'border-gray-400 hover:scale-110'
                  } ${dimple.isMatched ? 'ring-2 ring-green-400' : ''}`}
                  style={{
                    left: screenX,
                    top: screenY,
                    backgroundColor: dimple.color,
                    opacity: rotatedZ * 0.8 + 0.2 // Fade based on depth
                  }}
                />
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Selected Dimple Info */}
      {selectedDimple !== null && (
        <div className="px-4 mb-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Target Color:</p>
            <div 
              className="w-12 h-12 mx-auto rounded-full border-2 border-gray-400 mb-2"
              style={{ backgroundColor: dimples.find(d => d.id === selectedDimple)?.targetColor }}
            />
            <p className="text-xs text-gray-500">Tap colors below to blend</p>
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
              disabled={selectedDimple === null || isPaused}
              className="w-12 h-12 rounded-full border-2 border-white shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 disabled:opacity-50"
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