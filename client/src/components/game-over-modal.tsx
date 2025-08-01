import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, TrendingUp } from "lucide-react";

interface GameOverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalLevel: number;
  bestLevel: number;
  onPlayAgain: () => void;
}

export default function GameOverModal({ 
  open, 
  onOpenChange, 
  finalLevel, 
  bestLevel, 
  onPlayAgain 
}: GameOverModalProps) {
  const isNewRecord = finalLevel > bestLevel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-red-50 to-pink-50 border-0 shadow-2xl">
        <div className="text-center p-6">
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
          <div className="space-y-4 mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{finalLevel}</div>
              <div className="text-sm text-gray-600">Final Level</div>
            </div>

            {isNewRecord && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-2 border-yellow-300">
                <div className="text-lg font-bold text-orange-800">Previous Best: {bestLevel}</div>
                <div className="text-sm text-orange-600">You improved by {finalLevel - bestLevel} levels!</div>
              </div>
            )}
          </div>

          {/* Motivational Message */}
          <p className="text-gray-600 mb-8">
            {isNewRecord 
              ? "Incredible! You've set a new personal record. Keep pushing your limits!"
              : "Great effort! Every game makes you better. Ready for another challenge?"
            }
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onPlayAgain}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}