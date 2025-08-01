import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Play, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdScreenProps {
  onClose: () => void;
}

export default function AdScreen({ onClose }: AdScreenProps) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSkip(true);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      {/* Skip Button */}
      {canSkip && (
        <Button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:bg-white/20 transition-all duration-300"
          variant="ghost"
        >
          <X className="w-6 h-6 text-white" />
        </Button>
      )}

      {/* Countdown Timer */}
      {!canSkip && (
        <div className="absolute top-6 right-6 flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
          <Clock className="w-5 h-5 text-white" />
          <span className="text-white font-medium">{countdown}s</span>
        </div>
      )}

      {/* Main Ad Content */}
      <div className="max-w-md mx-4 text-center">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardContent className="p-8">
            {/* Premium Game Ad */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-xl flex items-center justify-center">
                <Play className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Puzzle Master Pro
              </h2>
              <p className="text-blue-100 text-sm mb-4">
                Challenge your mind with 50+ premium puzzle games
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-6 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white text-sm">No ads, unlimited play</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white text-sm">Daily challenges & rewards</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white text-sm">Global leaderboards</span>
              </div>
            </div>

            {/* CTA */}
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Try Free for 7 Days
            </Button>
            
            <p className="text-blue-200 text-xs mt-3">
              Cancel anytime • No commitment required
            </p>
          </CardContent>
        </Card>

        {/* App Branding */}
        <div className="mt-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            ColorMerge
          </h1>
          <p className="text-blue-200 text-sm">
            The ultimate color mixing challenge
          </p>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
      </div>
    </div>
  );
}