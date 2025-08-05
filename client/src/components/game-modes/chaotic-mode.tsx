import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameSettings } from "@/lib/game-engine";
import { Button } from "@/components/ui/button";
import { Heart, Pause } from "lucide-react";

interface ChaoticModeProps {
  gameSettings: GameSettings;
  onComplete: (success: boolean, score: number) => void;
  onGameOver: () => void;
}

interface BouncingShape {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  shape: 'circle' | 'square' | 'triangle';
  size: number;
  targetColor: string;
  currentColor: string;
  isMatched: boolean;
  colorClicks: { [key: string]: number };
}

export default function ChaoticMode({ gameSettings, onComplete, onGameOver }: ChaoticModeProps) {
  const [shapes, setShapes] = useState<BouncingShape[]>([]);
  const [selectedShape, setSelectedShape] = useState<number | null>(null);
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [completedShapes, setCompletedShapes] = useState(0);
  const [backgroundColor] = useState('rgb(25, 35, 45)');
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

  const maxShapes = settings.max_shapes || 8;
  const targetShapes = 12;

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
    if (shapes.length >= maxShapes) return;

    const shapes_available = ['circle', 'square', 'triangle'] as const;
    const shape = shapes_available[Math.floor(Math.random() * shapes_available.length)];
    const targetColorClicks = generateTargetColor();
    const targetColor = mixColors(targetColorClicks);

    const size = 20 + Math.random() * 20;
    const bounceSpeed = settings.bounce_speed || 2;

    const newShape: BouncingShape = {
      id: Date.now() + Math.random(),
      x: Math.random() * (400 - size) + size/2,
      y: Math.random() * (300 - size) + size/2,
      vx: (Math.random() - 0.5) * bounceSpeed * 4,
      vy: (Math.random() - 0.5) * bounceSpeed * 4,
      shape,
      size,
      targetColor,
      currentColor: 'rgba(150, 150, 150, 0.8)',
      isMatched: false,
      colorClicks: { blue: 0, red: 0, yellow: 0, white: 0, black: 0 }
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
    const spawnInterval = Math.max(500, 2000 - (settings.spawn_rate || 1) * 200);
    if (now - lastSpawnRef.current > spawnInterval) {
      spawnShape();
      lastSpawnRef.current = now;
    }

    // Move shapes and handle bouncing
    setShapes(prev => prev.map(shape => {
      if (shape.isMatched) return shape;

      let newX = shape.x + shape.vx;
      let newY = shape.y + shape.vy;
      let newVx = shape.vx;
      let newVy = shape.vy;

      // Bounce off walls
      if (newX <= shape.size/2 || newX >= 400 - shape.size/2) {
        newVx = -newVx;
        newX = Math.max(shape.size/2, Math.min(400 - shape.size/2, newX));
      }
      if (newY <= shape.size/2 || newY >= 600 - shape.size/2) {
        newVy = -newVy;
        newY = Math.max(shape.size/2, Math.min(600 - shape.size/2, newY));
      }

      return {
        ...shape,
        x: newX,
        y: newY,
        vx: newVx,
        vy: newVy
      };
    }));

    // Check for overcrowding
    const activeShapes = shapes.filter(s => !s.isMatched).length;
    if (activeShapes >= maxShapes) {
      setHearts(current => {
        const newHearts = current - 1;
        if (newHearts <= 0) {
          setTimeout(() => onGameOver(), 100);
        }
        return newHearts;
      });
      // Remove some shapes to give player a chance
      setShapes(prev => prev.filter((_, index) => index < maxShapes - 2));
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, shapes.length, settings]);

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
          setScore(prev => prev + 100);
          setCompletedShapes(prev => {
            const newCount = prev + 1;
            if (newCount >= targetShapes) {
              setTimeout(() => onComplete(true, score + 100), 100);
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

  const renderShape = (shape: BouncingShape) => {
    const isSelected = selectedShape === shape.id;
    const baseProps = {
      className: `cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-yellow-400' : ''}`,
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
            Matched: {completedShapes}/{targetShapes}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`text-sm px-2 py-1 rounded ${
            shapes.filter(s => !s.isMatched).length >= maxShapes - 2 
              ? 'bg-red-500/20 text-red-300' 
              : 'bg-white/10 text-white/80'
          }`}>
            Active: {shapes.filter(s => !s.isMatched).length}/{maxShapes}
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

      {/* Game Area */}
      <div className="flex-1 relative">
        <svg className="w-full h-full" viewBox="0 0 400 600">
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Bouncing shapes */}
          <AnimatePresence>
            {shapes.map(shape => (
              <motion.g
                key={shape.id}
                animate={{ 
                  x: shape.x - shape.size/2, 
                  y: shape.y - shape.size/2,
                  opacity: shape.isMatched ? 0 : 1 
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.1, ease: "linear" }}
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
            <p className="text-xs text-white/60">Match before it gets too chaotic!</p>
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