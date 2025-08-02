import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  const actualFinalLevel = Math.max(1, finalLevel - 1); // The level the user actually reached
  const isNewRecord = actualFinalLevel > bestLevel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-400 via-pink-500 via-red-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 to-purple-600 border-0 shadow-2xl opacity-100 transition-opacity duration-500">
        <DialogTitle className="sr-only">Game Over</DialogTitle>
        <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl mx-2 my-2 flex flex-col">
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
          <div className="space-y-4 mb-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{actualFinalLevel}</div>
              <div className="text-sm text-gray-600">Level Achieved</div>
            </div>

            {isNewRecord && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-2 border-yellow-300">
                <div className="text-lg font-bold text-orange-800">Previous Best: {bestLevel}</div>
                <div className="text-sm text-orange-600">You improved by {actualFinalLevel - bestLevel} levels!</div>
              </div>
            )}
          </div>

          {/* Motivational Message */}
          <p className="text-gray-600 mb-6">
            {isNewRecord 
              ? "Incredible! You've set a new personal record. Keep pushing your limits!"
              : "Great effort! Every game makes you better. Ready for another challenge?"
            }
          </p>

          {/* Action Button - Always Visible */}
          <div className="mb-6">
            <Button
              onClick={onPlayAgain}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
          </div>

          {/* Incorrect Guesses Summary - Scrollable */}
          {incorrectGuesses.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Incorrect Guesses</h3>
              <div className="max-h-80 overflow-y-auto bg-white/40 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incorrectGuesses.map((mistake, index) => (
                    <div key={index} className="bg-white/60 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Level {mistake.level}</div>
                      <div className="flex justify-between items-center space-x-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Your Guess</div>
                          <ColorPieChart colors={mistake.guess} size={50} />
                        </div>
                        <div className="text-xs text-gray-500">vs</div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600 mb-1">Correct</div>
                          <ColorPieChart colors={mistake.correct} size={50} />
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
    </Dialog>
  );
}