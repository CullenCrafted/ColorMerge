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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            How to Play ColorMerge
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Goal
            </h3>
            <p className="text-gray-600">Mix colors to match the target background color exactly. Fill the center circle completely to advance levels!</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              How to Play
            </h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Tap color buttons to fill the center circle progressively</li>
              <li>• Each level requires a specific number of color clicks</li>
              <li>• The circle fills from bottom to top as you mix</li>
              <li>• Match the exact background color to complete the level</li>
              <li>• Wrong guesses restart the same target - no heart lost!</li>
              <li>• Only lose hearts when you run out of attempts</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              Advanced Color Mixing
            </h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Blue + Yellow automatically creates Green</li>
              <li>• Red + White = Pink/Light Red tones</li>
              <li>• Multiple colors create complex blends</li>
              <li>• White lightens any color significantly</li>
              <li>• Black darkens and creates rich tones</li>
              <li>• Order doesn't matter - only the final combination</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              Visual Cues
            </h3>
            <ul className="text-gray-600 space-y-1">
              <li>• White target backgrounds show black circle outline</li>
              <li>• Circle border disappears on successful completion</li>
              <li>• Bubble explosions celebrate correct matches</li>
              <li>• Progress indicator shows color clicks in real-time</li>
              <li>• Background music and haptic feedback enhance gameplay</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              Hearts & Progression
            </h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Start with 3 hearts per game</li>
              <li>• Lose 1 heart only when completely out of attempts</li>
              <li>• Gain bonus hearts every 10 levels</li>
              <li>• Levels get progressively harder with more color clicks</li>
              <li>• Game ends when hearts reach 0</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-2 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Start Playing!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}