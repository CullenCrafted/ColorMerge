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
    resetAdState();
    onRestart();
    onOpenChange(false);
  };

  const handleWatchAd = () => {
    setShowingAd(true);
    setAdCountdown(15);
    setAdCompleted(false);
  };

  const handleContinueAfterAd = () => {
    resetAdState();
    onContinueWithHearts();
    onOpenChange(false);
  };

  const resetAdState = () => {
    setShowingAd(false);
    setAdCountdown(15);
    setAdCompleted(false);
    setFloatingBubbles([]);
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

  // Generate floating bubbles when modal opens
  useEffect(() => {
    if (open) {
      const colors = ['#3B82F6', '#EF4444', '#FBBF24', '#10B981', '#8B5CF6', '#F97316', '#EC4899'];
      const bubbles = Array.from({ length: 20 }, (_, i) => ({
        id: `bubble-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 30 + 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 2
      }));
      setFloatingBubbles(bubbles);
    } else {
      setFloatingBubbles([]);
    }
  }, [open]);

  if (showingAd) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 border-0 shadow-2xl relative">
          {/* Floating bubbles for ad screen */}
          <div className="absolute inset-0 pointer-events-none">
            {floatingBubbles.slice(0, 8).map((bubble) => (
              <div
                key={bubble.id}
                className="absolute rounded-full opacity-30 animate-bounce"
                style={{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  width: `${bubble.size * 0.8}px`,
                  height: `${bubble.size * 0.8}px`,
                  backgroundColor: bubble.color,
                  animation: `bounce ${bubble.duration}s infinite ${bubble.delay}s ease-in-out alternate`,
                }}
              />
            ))}
          </div>
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold text-center text-white drop-shadow-lg">
              Watch Ad for Hearts
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-6 p-4 relative z-10">
            <div className="flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full relative border-4 border-white/30">
                <Play className="w-16 h-16 text-white drop-shadow-lg" />
                {!adCompleted && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-lg animate-pulse">
                    {adCountdown}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-xl text-white font-semibold mb-2 drop-shadow-lg">
                {adCompleted ? "Ad Complete!" : "Playing advertisement..."}
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-white font-bold text-lg">
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
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border-2 border-dashed border-white/40">
                  <div className="text-center">
                    <div className="animate-pulse">
                      <div className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 rounded-lg p-4 mb-3 shadow-lg">
                        <h3 className="text-white font-bold text-lg drop-shadow">ColorMerge Premium</h3>
                        <p className="text-white/90 text-sm">Unlock unlimited hearts & exclusive themes!</p>
                      </div>
                      <div className="text-white font-bold text-lg drop-shadow">
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 border-0 shadow-2xl relative">
        {/* Floating bubbles background */}
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
                animation: `float-bubble ${bubble.duration}s infinite ${bubble.delay}s ease-in-out alternate`,
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
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full border-4 border-white/30 shadow-2xl">
              <Heart className="w-16 h-16 text-white drop-shadow-lg animate-pulse" />
            </div>
          </div>
          
          <div>
            <p className="text-xl text-white font-semibold mb-3 drop-shadow-lg">You ran out of hearts!</p>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center justify-center gap-3 text-3xl font-bold text-white mb-2">
                <Trophy className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
                <span className="drop-shadow-lg">Level {finalLevel}</span>
              </div>
              <p className="text-white/90 font-medium">Current level reached</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleWatchAd}
              className="w-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 border-2 border-white/30"
            >
              <Timer className="w-6 h-6 animate-spin" />
              Watch Ad for 2 Hearts
            </Button>

            <Button 
              onClick={handleRestart}
              className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/30 py-4 rounded-xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-6 h-6" />
              Start Over
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}