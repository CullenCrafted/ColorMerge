import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameSettings } from "@/lib/game-engine";
import { Button } from "@/components/ui/button";
import { Heart, Pause } from "lucide-react";

interface TetrisModeProps {
  gameSettings: GameSettings;
  onComplete: (success: boolean, score: number) => void;
  onGameOver: () => void;
}

interface FallingShape {
  id: number;
  x: number;
  y: number;
  shape: 'circle' | 'square' | 'triangle' | 'hexagon';
  size: number;
  targetColor: string;
  currentColor: string;
  isMatched: boolean;
  colorClicks: { [key: string]: number };
  fallSpeed: number;
}

export default function TetrisMode({ gameSettings, onComplete, onGameOver }: TetrisModeProps) {
  const [shapes, setShapes] = useState<FallingShape[]>([]);
  const [selectedShape, setSelectedShape] = useState<number | null>(null);
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [completedShapes, setCompletedShapes] = useState(0);
  const [backgroundColor] = useState('rgb(20, 30, 40)');
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef<number>(Date.now());

  const settings = gameSettings.settings;
  const colors = ['blue', 'red', 'yellow', 'white', 'black'];
  
  const colorValues = {
    blue: 'rgb(59, 130, 246)',
    red: 'rgb(239, 68, 68)',
    yellow: 'rgb(251, 191, 36)',
    white: 'rgb(255, 255, 255)',
    black: 'rgb(0, 0, 0)'
  };

  const shapeTargets = settings.shapes_per_wave || 8;

  // Generate random target color
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

  // Spawn new shape
  const spawnShape = () => {
    const shapes_available = ['circle', 'square', 'triangle', 'hexagon'] as const;
    const shape = shapes_available[Math.floor(Math.random() * (settings.shape_variety || 4))];
    const targetColorClicks = generateTargetColor();
    const targetColor = mixColors(targetColorClicks);

    const newShape: FallingShape = {
      id: Date.now() + Math.random(),
      x: Math.random() * 300 + 50, // Random x position
      y: -50, // Start above screen
      shape,
      size: 30 + Math.random() * 20,
      targetColor,
      currentColor: 'rgba(150, 150, 150, 0.8)',
      isMatched: false,
      colorClicks: { blue: 0, red: 0, yellow: 0, white: 0, black: 0 },
      fallSpeed: settings.fall_speed || 1
    };

    setShapes(prev => [...prev, newShape]);
  };

  // Animation loop
  const animate = () => {
    if (isPaused) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Spawn new shapes
    const now = Date.now();
    const spawnInterval = Math.max(500, 2000 - (settings.fall_speed || 1) * 300);
    if (now - lastSpawnRef.current > spawnInterval && shapes.length < 6) {
      spawnShape();
      lastSpawnRef.current = now;
    }

    // Move shapes down
    setShapes(prev => prev.map(shape => ({
      ...shape,
      y: shape.y + shape.fallSpeed * 2
    })).filter(shape => {
      // Remove shapes that hit the bottom
      if (shape.y > 600) {
        if (!shape.isMatched) {
          setHearts(current => {
            const newHearts = current - 1;
            if (newHearts <= 0) {
              setTimeout(() => onGameOver(), 100);
            }
            return newHearts;
          });
        }
        return false;
      }
      return true;
    }));

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, shapes.length, settings.fall_speed]);

  const handleColorClick = (color: string) => {
    if (selectedShape === null || isPaused) return;

    setShapes(prev => prev.map(shape => {
      if (shape.id === selectedShape && !shape.isMatched) {
        const newColorClicks = { ...shape.colorClicks };
        newColorClicks[color] = (newColorClicks[color] || 0) + 1;
        const newColor = mixColors(newColorClicks);
        
        // Check if color matches target
        const colorDistance = getColorDistance(newColor, shape.targetColor);
        const isMatched = colorDistance < 40;
        
        if (isMatched) {
          setScore(prev => prev + Math.max(50, 200 - Math.floor(shape.y / 3)));
          setCompletedShapes(prev => {
            const newCount = prev + 1;
            if (newCount >= shapeTargets) {
              setTimeout(() => onComplete(true, score + Math.max(50, 200 - Math.floor(shape.y / 3))), 100);
            }
            return newCount;
          });
        }
        
        return {
          ...shape,
          colorClicks: newColorClicks,
          currentColor: newColor,
          isMatched
        };
      }
      return shape;
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

  const handleShapeClick = (shapeId: number) => {
    if (isPaused) return;
    setSelectedShape(shapeId === selectedShape ? null : shapeId);
  };

  const renderShape = (shape: FallingShape) => {
    const isSelected = selectedShape === shape.id;
    const baseProps = {
      className: `cursor-pointer transition-all duration-200 ${isSelected ? 'ring-4 ring-yellow-400' : ''}`,
      onClick: () => handleShapeClick(shape.id),
      style: { fill: shape.isMatched ? 'transparent' : shape.currentColor }
    };

    switch (shape.shape) {
      case 'circle':
        return <circle cx={shape.size/2} cy={shape.size/2} r={shape.size/2} {...baseProps} />;
      case 'square':
        return <rect width={shape.size} height={shape.size} {...baseProps} />;
      case 'triangle':
        return <polygon points={`${shape.size/2},0 0,${shape.size} ${shape.size},${shape.size}`} {...baseProps} />;
      case 'hexagon':
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (i * 60 - 90) * Math.PI / 180;
          const x = shape.size/2 + (shape.size/2) * Math.cos(angle);
          const y = shape.size/2 + (shape.size/2) * Math.sin(angle);
          return `${x},${y}`;
        }).join(' ');
        return <polygon points={points} {...baseProps} />;
      default:
        return <circle cx={shape.size/2} cy={shape.size/2} r={shape.size/2} {...baseProps} />;
    }
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
          <div className="text-sm text-white/80">
            Completed: {completedShapes}/{shapeTargets}
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

      {/* Game Area */}
      <div className="flex-1 relative">
        <svg className="w-full h-full" viewBox="0 0 400 600">
          {/* Ground line */}
          <line x1="0" y1="580" x2="400" y2="580" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
          
          {/* Falling shapes */}
          <AnimatePresence>
            {shapes.map(shape => (
              <motion.g
                key={shape.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: shape.isMatched ? 0 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{ transform: `translate(${shape.x}px, ${shape.y}px)` }}
              >
                {renderShape(shape)}
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>
      </div>

      {/* Selected Shape Info */}
      {selectedShape !== null && (
        <div className="px-4 mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
            <p className="text-sm text-white/80 mb-2">Target Color:</p>
            <div 
              className="w-12 h-12 mx-auto rounded-full border-2 border-white/40 mb-2"
              style={{ backgroundColor: shapes.find(s => s.id === selectedShape)?.targetColor }}
            />
            <p className="text-xs text-white/60">Complete the blend before it hits the ground!</p>
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
              disabled={selectedShape === null || isPaused}
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