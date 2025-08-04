import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trophy, Heart, RotateCcw, Play, Timer, ChevronDown, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";

// Pie chart component for showing color mixtures
const ColorPieChart = ({ colors, size = 30 }: { colors: string[]; size?: number }) => {
  if (colors.length === 0) return <div className={`w-8 h-8 bg-gray-300 rounded-full`} />;
  
  const colorCounts = colors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = colors.length;
  
  // If only one color, show a solid circle
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
  onContinueWithHearts: () => void;
}

export default function HeartsOutModal({ open, onOpenChange, finalLevel, bestLevel, incorrectGuesses, onRestart, onContinueWithHearts }: HeartsOutModalProps) {
  const [showingAd, setShowingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);
  const [adCompleted, setAdCompleted] = useState(false);
  const [showingPayment, setShowingPayment] = useState(false);
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

  const handlePurchaseHearts = () => {
    setShowingPayment(true);
    // Simulate payment processing
    setTimeout(() => {
      setShowingPayment(false);
      // Give 20 hearts and continue
      onContinueWithHearts();
      onOpenChange(false);
    }, 2000);
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
    setShowingPayment(false);
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
      console.log('Modal opened, generating bubbles...');
      const colors = ['#3B82F6', '#EF4444', '#FBBF24', '#10B981', '#8B5CF6', '#F97316', '#EC4899'];
      const newBubbles = Array.from({ length: 20 }, (_, i) => ({
        id: `bubble-${i}-${Date.now()}`,
        x: Math.random() * 100, // percentage positions
        y: Math.random() * 100,
        size: 8 + Math.random() * 12, // 8-20px
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 3 + Math.random() * 2, // 3-5 seconds
        delay: Math.random() * 1000 // 0-1 second delay
      }));
      console.log('Generated bubbles:', newBubbles.length);
      setFloatingBubbles(newBubbles);
    } else {
      setFloatingBubbles([]);
    }
  }, [open]);

  if (showingPayment) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 border-0 shadow-2xl relative sm:rounded-lg" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <DialogHeader className="text-center relative z-10">
            <DialogTitle className="text-2xl font-bold text-white drop-shadow-lg mb-2">
              Processing Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-6 p-4 relative z-10">
            <div className="flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full relative border-4 border-white/30">
                <DollarSign className="w-16 h-16 text-white drop-shadow-lg animate-pulse" />
              </div>
            </div>
            
            <div>
              <p className="text-xl text-white font-semibold mb-2 drop-shadow-lg">
                Purchasing 20 Hearts
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-white font-bold text-lg">
                  💳 Processing $0.99...
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border-2 border-dashed border-white/40">
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-lg p-4 mb-3 shadow-lg">
                      <h3 className="text-white font-bold text-lg drop-shadow">Secure Payment</h3>
                      <p className="text-white/90 text-sm">Powered by Stripe • Safe & Encrypted</p>
                    </div>
                    <div className="text-white font-bold text-lg drop-shadow">
                      Your hearts will be added instantly
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (showingAd) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 border-0 shadow-2xl relative sm:rounded-lg" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {/* Floating bubbles for ad screen */}
          <div className="absolute inset-0 pointer-events-none">
            {floatingBubbles.slice(0, 8).map((bubble) => (
              <div
                key={bubble.id}
                className="absolute rounded-full opacity-40"
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
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // If user closes modal with X, restart the game
        handleRestart();
      }
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 border-0 shadow-2xl relative sm:rounded-lg" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
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
              
              {/* Debug info - remove this later */}
              <div className="mt-1 text-xs text-white/50 text-center">
                Current: {finalLevel} | Best: {bestLevel} | Show: {finalLevel > bestLevel ? 'YES' : 'NO'}
              </div>
            </div>
          </div>

          {/* Show incorrect guesses review */}
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
                      {/* Your Guess */}
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-red-300 mb-1">Your guess</span>
                        <ColorPieChart colors={mistake.guess} size={30} />
                      </div>
                      
                      <div className="text-white/60 text-lg">vs</div>
                      
                      {/* Correct Answer */}
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

          <div className="space-y-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 text-white py-3 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 border-2 border-white/30">
                  <Heart className="w-5 h-5" />
                  Get More Hearts
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-sm border border-white/50 shadow-2xl rounded-xl p-2">
                <DropdownMenuItem 
                  onClick={handleWatchAd}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-100/80 cursor-pointer transition-colors"
                >
                  <div className="bg-green-500 rounded-full p-2">
                    <Timer className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">Watch 15s Ad</p>
                    <p className="text-sm text-gray-600">Get 2 hearts • Free</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handlePurchaseHearts}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-yellow-100/80 cursor-pointer transition-colors"
                >
                  <div className="bg-yellow-500 rounded-full p-2">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">Buy Hearts</p>
                    <p className="text-sm text-gray-600">Get 20 hearts • $0.99</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={handleRestart}
              className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/30 py-3 rounded-xl font-bold shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
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