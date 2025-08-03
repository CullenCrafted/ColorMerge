import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Heart, RotateCcw, Play, Timer } from "lucide-react";
import { useState, useEffect } from "react";

interface HeartsOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalLevel: number;
  onRestart: () => void;
  onContinueWithHearts: () => void;
}

export default function HeartsOutModal({ open, onOpenChange, finalLevel, onRestart, onContinueWithHearts }: HeartsOutModalProps) {
  const [showingAd, setShowingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);
  const [adCompleted, setAdCompleted] = useState(false);

  const handleRestart = () => {
    onRestart();
    onOpenChange(false);
    resetAdState();
  };

  const handleWatchAd = () => {
    setShowingAd(true);
    setAdCountdown(15);
    setAdCompleted(false);
  };

  const handleContinueAfterAd = () => {
    onContinueWithHearts();
    onOpenChange(false);
    resetAdState();
  };

  const resetAdState = () => {
    setShowingAd(false);
    setAdCountdown(15);
    setAdCompleted(false);
  };

  // Ad countdown timer
  useEffect(() => {
    if (showingAd && adCountdown > 0) {
      const timer = setTimeout(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showingAd && adCountdown === 0) {
      setAdCompleted(true);
    }
  }, [showingAd, adCountdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      resetAdState();
    }
  }, [open]);

  if (showingAd) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Watch Ad for Hearts
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-6 p-4">
            <div className="flex justify-center">
              <div className="bg-blue-100 p-6 rounded-full relative">
                <Play className="w-16 h-16 text-blue-500" />
                {!adCompleted && (
                  <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {adCountdown}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-lg text-gray-700 mb-2">
                {adCompleted ? "Ad Complete!" : "Playing advertisement..."}
              </p>
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3 border border-yellow-300">
                <p className="text-orange-800 font-medium">
                  {adCompleted ? "🎉 You earned 2 hearts!" : `⏱️ ${adCountdown} seconds remaining`}
                </p>
              </div>
            </div>

            {adCompleted ? (
              <Button 
                onClick={handleContinueAfterAd}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5" />
                Continue with 2 Hearts
              </Button>
            ) : (
              <div className="bg-gray-100 rounded-xl p-4">
                <div className="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="animate-pulse">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg p-4 mb-3">
                        <h3 className="text-white font-bold text-lg">ColorMerge Premium</h3>
                        <p className="text-purple-100 text-sm">Unlock unlimited hearts & exclusive themes!</p>
                      </div>
                      <div className="text-purple-600 font-medium">
                        Try free for 7 days
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-br from-red-50 to-pink-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Out of Hearts!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6 p-4">
          <div className="flex justify-center">
            <div className="bg-red-100 p-4 rounded-full">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
          </div>
          
          <div>
            <p className="text-lg text-gray-700 mb-2">You ran out of hearts!</p>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-purple-600">
              <Trophy className="w-6 h-6" />
              <span>Level {finalLevel}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Current level reached</p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleWatchAd}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Timer className="w-5 h-5" />
              Watch Ad for 2 Hearts
            </Button>

            <Button 
              onClick={handleRestart}
              variant="outline"
              className="w-full border-2 border-purple-200 text-purple-600 hover:bg-purple-50 py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Start Over
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}