import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, TrendingUp } from "lucide-react";

interface IncorrectGuess {
  guess: string[];
  correct: string[];
  level: number;
}

interface GameOverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalLevel: number;
  bestLevel: number;
  incorrectGuesses: IncorrectGuess[];
  onPlayAgain: () => void;
}

// Pie chart component for showing color mixtures
const ColorPieChart = ({ colors, size = 60 }: { colors: string[]; size?: number }) => {
  if (colors.length === 0) return <div className={`w-${size/4} h-${size/4} bg-gray-300 rounded-full`} />;
  
  const colorCounts = colors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = colors.length;
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

    return { color, count, pathData };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="drop-shadow-lg">
        {segments.map(({ color, count, pathData }, index) => (
          <path
            key={index}
            d={pathData}
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-1">
        {Object.entries(colorCounts).map(([color, count]) => (
          <div key={color} className="flex items-center text-xs bg-black/10 rounded px-1">
            <div 
              className="w-2 h-2 rounded-full mr-1" 
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-700">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function GameOverModal({ 
  open, 
  onOpenChange, 
  finalLevel, 
  bestLevel, 
  incorrectGuesses,
  onPlayAgain 
}: GameOverModalProps) {
  const actualFinalLevel = finalLevel; // Show the actual level they reached
  const isNewRecord = actualFinalLevel > bestLevel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 border-0 shadow-2xl text-white">
          <DialogTitle className="sr-only">Game Over</DialogTitle>
          <DialogDescription className="sr-only">Your game statistics and performance summary</DialogDescription>
          <div className="overflow-y-auto max-h-[85vh] space-y-6 p-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                {isNewRecord ? "New Record!" : "Game Over"}
              </h2>
              <p className="text-xl text-pink-100">
                You reached level {actualFinalLevel}!
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-300">{actualFinalLevel}</div>
                <div className="text-sm text-pink-200">Level Achieved</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-300">{bestLevel}</div>
                <div className="text-sm text-pink-200">Personal Best</div>
              </div>
            </div>

            {/* New Record Badge */}
            {isNewRecord && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mb-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-white" />
                <div className="text-lg font-bold text-white">New Record!</div>
                <div className="text-sm text-yellow-100">+{actualFinalLevel - bestLevel} levels better</div>
              </div>
            )}

            {/* Action Button */}
            <div className="mb-6">
              <Button
                onClick={onPlayAgain}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again
              </Button>
            </div>

            {/* Incorrect Guesses - Scrollable */}
            {incorrectGuesses.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="text-lg font-bold text-pink-100 mb-4 text-center">Your Mistakes</h3>
                <div className="max-h-64 overflow-y-auto space-y-3 overscroll-contain">
                  {incorrectGuesses.map((mistake, index) => (
                    <div key={index} className="bg-white/20 rounded-lg p-3">
                      <div className="text-sm font-medium text-yellow-200 mb-2">Level {mistake.level}</div>
                      <div className="flex justify-between items-center space-x-4">
                        <div className="text-center flex-1">
                          <div className="text-xs text-pink-200 mb-2">Your Guess</div>
                          <ColorPieChart colors={mistake.guess} size={50} />
                        </div>
                        <div className="text-pink-300 font-bold">VS</div>
                        <div className="text-center flex-1">
                          <div className="text-xs text-pink-200 mb-2">Correct Answer</div>
                          <ColorPieChart colors={mistake.correct} size={50} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}