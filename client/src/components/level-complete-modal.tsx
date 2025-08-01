import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Heart, Zap } from "lucide-react";

interface LevelCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: number;
  streak: number;
  hearts: number;
  onContinue: () => void;
}

export default function LevelCompleteModal({ 
  open, 
  onOpenChange, 
  level, 
  streak, 
  hearts, 
  onContinue 
}: LevelCompleteModalProps) {
  const isHeartLevel = level % 10 === 0;
  const isStreakMilestone = streak > 0 && streak % 5 === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-2xl">
        <div className="text-center p-6">
          {/* Animated Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-once">
            <Star className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Level Complete!
          </h2>

          {/* Level Display */}
          <div className="text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
            {level}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-purple-500 mr-1" />
                <span className="text-lg font-bold text-purple-600">{streak}</span>
              </div>
              <div className="text-sm text-gray-600">Streak</div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-5 h-5 text-red-500 mr-1" />
                <span className="text-lg font-bold text-red-600">{hearts}</span>
              </div>
              <div className="text-sm text-gray-600">Hearts</div>
            </div>
          </div>

          {/* Special Milestones */}
          {(isHeartLevel || isStreakMilestone) && (
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 mb-6 border-2 border-yellow-300">
              {isHeartLevel && (
                <div className="flex items-center justify-center mb-2">
                  <Heart className="w-6 h-6 text-red-500 mr-2" />
                  <span className="text-lg font-bold text-orange-800">Bonus Heart Earned!</span>
                </div>
              )}
              {isStreakMilestone && (
                <div className="flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-500 mr-2" />
                  <span className="text-lg font-bold text-orange-800">Amazing Streak!</span>
                </div>
              )}
            </div>
          )}

          {/* Encouragement */}
          <p className="text-gray-600 mb-8">
            {streak >= 10 
              ? "You're on fire! Your color-mixing skills are incredible!" 
              : streak >= 5 
              ? "Excellent work! You're building great momentum!" 
              : "Well done! Ready for the next challenge?"
            }
          </p>

          {/* Continue Button */}
          <Button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}