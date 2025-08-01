import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Palette, Target, Heart, Trophy, Zap } from "lucide-react";

interface InstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: string;
}

export default function InstructionsModal({ open, onOpenChange, game }: InstructionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            How to Play ColorMerge
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4">
          {/* Game Overview */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/40">
            <div className="flex items-center mb-4">
              <Target className="w-8 h-8 text-purple-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Objective</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Mix colors to match the target color shown at the top of the screen. 
              Use the five color buttons (blue, red, yellow, white, black) to create the perfect blend.
            </p>
          </div>

          {/* How to Play */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/40">
            <div className="flex items-center mb-4">
              <Palette className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">How to Play</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Tap color buttons to add them to your mix</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Watch your current mix change in real-time</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">You have limited mixing attempts per level</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Match the target color exactly to advance</p>
              </div>
            </div>
          </div>

          {/* Hearts System */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/40">
            <div className="flex items-center mb-4">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Hearts & Lives</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700">
                You start with 3 hearts. Lose a heart when you fail a level.
              </p>
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3 border border-yellow-300">
                <p className="text-orange-800 font-medium">
                  💡 <strong>Bonus Hearts:</strong> Complete levels with extra moves remaining to earn bonus hearts!
                </p>
              </div>
            </div>
          </div>

          {/* Scoring & Streaks */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/40">
            <div className="flex items-center mb-4">
              <Zap className="w-8 h-8 text-purple-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Streaks & Rewards</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Build streaks by completing consecutive levels</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Every 10th level rewards you with a bonus heart</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Levels get progressively more challenging</p>
              </div>
            </div>
          </div>

          {/* Tips & Tricks */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6 border border-green-300">
            <div className="flex items-center mb-4">
              <Trophy className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Pro Tips</h3>
            </div>
            <div className="space-y-2">
              <p className="text-green-800">
                <strong>Start Light:</strong> Begin with lighter colors and gradually add darker ones
              </p>
              <p className="text-green-800">
                <strong>Small Steps:</strong> Make incremental changes rather than big jumps
              </p>
              <p className="text-green-800">
                <strong>Study Patterns:</strong> Learn how different color combinations affect the result
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Start Playing!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}