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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <DialogContent className="max-w-md w-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 border-0 shadow-2xl rounded-3xl transition-all duration-500 transform scale-100 relative">
          <DialogTitle className="sr-only">Game Over</DialogTitle>
          <DialogDescription className="sr-only">Your game statistics and performance summary</DialogDescription>
          <div className="text-center p-6 bg-white/90 rounded-2xl mx-2 my-2 flex flex-col border border-white/30">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            {isNewRecord ? (
              <Trophy className="w-10 h-10 text-white" />
            ) : (
              <TrendingUp className="w-10 h-10 text-white" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isNewRecord ? "New Record!" : "Game Over"}
          </h2>

          {/* Stats */}
          <div className="space-y-3 mb-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3">
              <div className="text-xl font-bold text-gray-900">{actualFinalLevel}</div>
              <div className="text-xs text-gray-600">Level Achieved</div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3">
              <div className="text-lg font-bold text-yellow-600">{bestLevel}</div>
              <div className="text-xs text-gray-600">Personal Best</div>
            </div>

            {isNewRecord && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-3 border border-yellow-300">
                <div className="text-sm font-bold text-orange-800">New Record!</div>
                <div className="text-xs text-orange-600">+{actualFinalLevel - bestLevel} levels better</div>
              </div>
            )}
          </div>

          {/* Motivational Message */}
          <p className="text-gray-600 text-sm mb-4">
            {isNewRecord 
              ? "New personal record! Keep pushing your limits!"
              : "Great effort! Ready for another challenge?"
            }
          </p>

          {/* Action Button - Always Visible */}
          <div className="mb-4">
            <Button
              onClick={onPlayAgain}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2.5 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>

          {/* Incorrect Guesses Summary - All Mistakes */}
          {incorrectGuesses.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">All Mistakes ({incorrectGuesses.length})</h3>
              <div className="max-h-64 overflow-y-auto bg-white/30 rounded-xl p-3">
                <div className="grid grid-cols-1 gap-3">
                  {incorrectGuesses.map((mistake, index) => (
                    <div key={index} className="bg-white/50 rounded-lg p-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">Level {mistake.level}</div>
                      <div className="flex justify-between items-center space-x-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Your Guess</div>
                          <ColorPieChart colors={mistake.guess} size={40} />
                        </div>
                        <div className="text-xs text-gray-500">vs</div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Correct</div>
                          <ColorPieChart colors={mistake.correct} size={40} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}