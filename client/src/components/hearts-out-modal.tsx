import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Heart, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";

const ColorPieChart = ({ colors, size = 30 }: { colors: string[]; size?: number }) => {
  if (colors.length === 0) return <div className={`w-8 h-8 bg-gray-300 rounded-full`} />;
  
  const colorCounts = colors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = colors.length;
  
  if (Object.keys(colorCounts).length === 1) {
    const [singleColor] = Object.keys(colorCounts);
    return (
      <div 
        className="rounded-full drop-shadow-lg border-2 border-white/50" 
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: singleColor === 'red' ? 'rgb(255, 0, 0)' 
            : singleColor === 'yellow' ? 'rgb(255, 255, 0)'
            : singleColor === 'blue' ? 'rgb(0, 0, 255)'
            : singleColor === 'white' ? 'rgb(255, 255, 255)'
            : singleColor === 'black' ? 'rgb(0, 0, 0)'
            : singleColor
        }}
      />
    );
  }

  let currentAngle = 0;
  const segments = Object.entries(colorCounts).map(([color, count]) => {
    const percentage = count / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    const startX = Math.cos((startAngle - 90) * Math.PI / 180) * (size/2);
    const startY = Math.sin((startAngle - 90) * Math.PI / 180) * (size/2);
    const endX = Math.cos((endAngle - 90) * Math.PI / 180) * (size/2);
    const endY = Math.sin((endAngle - 90) * Math.PI / 180) * (size/2);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${size/2} ${size/2}`,
      `L ${size/2 + startX} ${size/2 + startY}`,
      `A ${size/2} ${size/2} 0 ${largeArcFlag} 1 ${size/2 + endX} ${size/2 + endY}`,
      'Z'
    ].join(' ');

    return (
      <path
        key={color}
        d={pathData}
        fill={color === 'red' ? 'rgb(255, 0, 0)' 
          : color === 'yellow' ? 'rgb(255, 255, 0)'
          : color === 'blue' ? 'rgb(0, 0, 255)'
          : color === 'white' ? 'rgb(255, 255, 255)'
          : color === 'black' ? 'rgb(0, 0, 0)'
          : color}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1"
      />
    );
  });

  return (
    <svg width={size} height={size} className="drop-shadow-lg">
      {segments}
    </svg>
  );
};

interface IncorrectGuess {
  guess: string[];
  correct: string[];
  level: number;
}

interface HeartsOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalLevel: number;
  bestLevel: number;
  incorrectGuesses: IncorrectGuess[];
  onRestart: () => void;
}

export default function HeartsOutModal({ open, onOpenChange, finalLevel, bestLevel, incorrectGuesses, onRestart }: HeartsOutModalProps) {
  const [floatingBubbles, setFloatingBubbles] = useState<Array<{
    id: string;
    x: number;
    y: number;
    size: number;
    color: string;
    duration: number;
    delay: number;
  }>>([]);

  const handleRestart = () => {
    onRestart();
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      const colors = ['#3B82F6', '#EF4444', '#FBBF24', '#10B981', '#8B5CF6', '#F97316', '#EC4899'];
      const newBubbles = Array.from({ length: 20 }, (_, i) => ({
        id: `bubble-${i}-${Date.now()}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 8 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 1000
      }));
      setFloatingBubbles(newBubbles);
    } else {
      setFloatingBubbles([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleRestart();
      }
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 border-0 shadow-2xl relative sm:rounded-lg" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          {floatingBubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="absolute rounded-full opacity-20"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                backgroundColor: bubble.color,
                animation: `float-bubble ${bubble.duration}s infinite ${bubble.delay}ms ease-in-out`,
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}
            />
          ))}
        </div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-3xl font-bold text-center text-white drop-shadow-lg">
            Out of Hearts!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6 p-4 relative z-10">
          <div className="flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border-4 border-white/30 shadow-2xl">
              <Heart className="w-12 h-12 text-white drop-shadow-lg animate-pulse" />
            </div>
          </div>
          
          <div>
            <p className="text-lg text-white font-semibold mb-2 drop-shadow-lg">You ran out of hearts!</p>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-1">
                <Trophy className="w-6 h-6 text-yellow-300 drop-shadow-lg" />
                <span className="drop-shadow-lg">Level {finalLevel}</span>
              </div>
              <p className="text-white/90 text-sm font-medium">Current level reached</p>
              {finalLevel > bestLevel && (
                <div className="mt-2 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-lg p-3 border-2 border-yellow-400/50 shadow-lg relative z-50">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">🏆</span>
                    <p className="text-yellow-200 text-sm font-bold animate-pulse">NEW BEST LEVEL!</p>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <p className="text-yellow-300/80 text-xs text-center mt-1">Previous best: {bestLevel}</p>
                </div>
              )}
            </div>
          </div>

          {incorrectGuesses.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-bold text-sm mb-3 text-center">Missed Combinations:</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {incorrectGuesses.slice(-3).map((mistake, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-2 border border-white/10">
                    <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                      <span>Level {mistake.level}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-red-300 mb-1">Your guess</span>
                        <ColorPieChart colors={mistake.guess} size={30} />
                      </div>
                      
                      <div className="text-white/60 text-lg">vs</div>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-green-300 mb-1">Correct</span>
                        <ColorPieChart colors={mistake.correct} size={30} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleRestart}
            className="w-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 text-white py-3 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 border-2 border-white/30"
          >
            <RotateCcw className="w-5 h-5" />
            Start Over
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
