import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, RotateCcw, Pause, Volume2, VolumeX, Trophy, Heart } from "lucide-react";
import { ColorMergeLogic } from "@/lib/colormerge-logic";
import { useGameStats } from "@/hooks/use-game-stats";
import { useToast } from "@/hooks/use-toast";
import InstructionsModal from "@/components/instructions-modal";
import GameOverModal from "@/components/game-over-modal";

export default function ColorMerge() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  const [gameLogic, setGameLogic] = useState<ColorMergeLogic>(new ColorMergeLogic());
  const [gameState, setGameState] = useState(gameLogic.getState());
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [showHeartLoss, setShowHeartLoss] = useState(false);
  const [showHeartGain, setShowHeartGain] = useState(false);
  const [previousHearts, setPreviousHearts] = useState(3);
  const { stats, updateStats } = useGameStats("colormerge");
  const { toast } = useToast();

  // Haptic feedback function
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Calculate text color based on background brightness
  const getContrastTextColor = (backgroundColor: string): string => {
    // Extract RGB values from rgb() string
    const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return 'text-white';
    
    const [, r, g, b] = rgbMatch.map(Number);
    // Calculate brightness using relative luminance formula
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    
    return brightness > 128 ? 'text-black' : 'text-white';
  };

  useEffect(() => {
    if (stats) {
      const newLogic = new ColorMergeLogic((stats as any).currentLevel || 1, (stats as any).hearts || 3);
      setGameLogic(newLogic);
      setGameState(newLogic.getState());
    }
  }, [stats]);

  // Trigger haptic feedback when level changes
  useEffect(() => {
    triggerHaptic('medium');
  }, [gameState.currentLevel]);

  const handleColorClick = (color: string) => {
    if (isPaused) return;
    
    triggerHaptic('light');
    const previousHeartCount = gameState.hearts;
    const result = gameLogic.addColor(color);
    const newState = gameLogic.getState();
    setGameState(newState);

    // Check for heart changes
    if (newState.hearts < previousHeartCount) {
      // Heart lost
      triggerHaptic('medium');
      setShowHeartLoss(true);
      setTimeout(() => setShowHeartLoss(false), 1000);
    } else if (newState.hearts > previousHeartCount) {
      // Heart gained
      setShowHeartGain(true);
      setTimeout(() => setShowHeartGain(false), 1000);
    }

    if (result.levelComplete) {
      // Success haptic and flash title
      triggerHaptic('heavy');
      setShowSuccessFlash(true);
      
      // Auto-advance to next level after brief flash
      setTimeout(() => {
        setShowSuccessFlash(false);
        const prevHearts = gameLogic.getState().hearts;
        gameLogic.nextLevel();
        const nextState = gameLogic.getState();
        setGameState(nextState);
        
        // Check if heart was gained during level progression
        if (nextState.hearts > prevHearts) {
          setShowHeartGain(true);
          setTimeout(() => setShowHeartGain(false), 1000);
          toast({
            title: "Bonus Heart!",
            description: "Level 10 milestone reached!",
          });
        }
      }, 800);

      // Update stats with proper streak increment
      const newStreak = newState.currentStreak;
      updateStats({
        currentLevel: newState.currentLevel,
        bestLevel: Math.max((stats as any)?.bestLevel || 0, newState.currentLevel),
        hearts: newState.hearts,
        streak: newStreak,
        totalPlays: ((stats as any)?.totalPlays || 0) + 1,
      });

      if (result.bonusHeart) {
        toast({
          title: "Perfect! Bonus Heart Earned",
          description: "Solved with extra moves!",
        });
      }
    }

    if (result.gameOver) {
      triggerHaptic('heavy');
      updateStats({
        currentLevel: 1,
        hearts: 3,
        streak: 0,
        totalPlays: ((stats as any)?.totalPlays || 0) + 1,
      });
      setShowGameOver(true);
    }
  };

  const handleResetLevel = () => {
    gameLogic.resetLevel();
    setGameState(gameLogic.getState());
  };

  const colorButtons = [
    { color: 'blue', bgColor: 'from-blue-400 to-blue-600', shadowColor: 'shadow-blue-500/50' },
    { color: 'red', bgColor: 'from-red-400 to-red-600', shadowColor: 'shadow-red-500/50' },
    { color: 'yellow', bgColor: 'from-yellow-300 to-yellow-500', shadowColor: 'shadow-yellow-500/50' },
    { color: 'white', bgColor: 'from-gray-100 to-white', shadowColor: 'shadow-gray-500/50', textColor: 'text-gray-800' },
    { color: 'black', bgColor: 'from-gray-800 to-black', shadowColor: 'shadow-gray-900/50' },
  ];

  // Get dynamic text color based on background
  const targetColor = gameLogic.getTargetColorString();
  const textColorClass = getContrastTextColor(targetColor);

  return (
    <>
      {/* Full Background with Target Color */}
      <div 
        className="fixed inset-0 transition-all duration-1000 ease-out"
        style={{ 
          backgroundColor: gameLogic.getTargetColorString()
        }}
      />
      
      <div className="h-screen flex flex-col relative z-10 overflow-hidden">
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-bounce-gentle"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 relative z-20">
          <div className="flex items-center space-x-4">
            <h1 className={`text-2xl font-bold drop-shadow-lg transition-all duration-300 ${
              showSuccessFlash ? 'text-green-400 scale-110' : textColorClass
            }`}>
              ColorMerge
            </h1>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className={`text-lg font-semibold ${textColorClass}`}>{(stats as any)?.bestLevel || 0}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 relative z-30 pointer-events-auto"
            >
              {soundEnabled ? <Volume2 className={`w-5 h-5 ${textColorClass}`} /> : <VolumeX className={`w-5 h-5 ${textColorClass}`} />}
            </Button>
            <Button
              onClick={() => setIsPaused(!isPaused)}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 relative z-30 pointer-events-auto"
            >
              <Pause className={`w-5 h-5 ${textColorClass}`} />
            </Button>
            <Button
              onClick={() => setShowInstructions(true)}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 relative z-30 pointer-events-auto"
            >
              <HelpCircle className={`w-5 h-5 ${textColorClass}`} />
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="flex items-center justify-center space-x-8 mb-4 relative z-20">
          <div className="text-center">
            <div className={`text-xl font-bold ${textColorClass} drop-shadow-lg`}>{gameState.currentLevel}</div>
            <div className={`text-sm ${textColorClass} opacity-80`}>Level</div>
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-bold ${textColorClass} drop-shadow-lg`}>{gameState.currentStreak}</div>
            <div className={`text-sm ${textColorClass} opacity-80`}>Streak</div>
          </div>
          
          <div className="flex items-center space-x-1 relative">
            {Array.from({ length: Math.max(5, gameState.hearts) }, (_, i) => (
              <Heart
                key={i}
                className={`w-6 h-6 ${i < gameState.hearts ? 'text-red-400 fill-current' : 'text-white/30'} transition-all duration-300 drop-shadow-lg`}
              />
            ))}
            {showHeartLoss && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <span className="text-2xl text-red-500 font-bold drop-shadow-lg">-❤️</span>
              </div>
            )}
            {showHeartGain && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <span className="text-2xl text-green-500 font-bold drop-shadow-lg">+❤️</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Game Area - Centered Mixing Circle */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-20">
          {/* Current Mix Display - Only circle, hidden when matched */}
          <div className="text-center mb-8">
            <div className="relative">
              <div
                className={`w-48 h-48 rounded-full shadow-2xl transition-all duration-300 ${
                  showSuccessFlash ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                }`}
                style={{ 
                  backgroundColor: gameLogic.getCurrentColorString(),
                  boxShadow: `0 20px 40px rgba(0,0,0,0.3)`
                }}
              />
            </div>
          </div>

          {/* Mix Progress Indicator */}
          <div className="flex items-center justify-center space-x-3 mb-8 bg-black/20 backdrop-blur-lg rounded-2xl p-3 border border-white/20">
            {colorButtons.map(({ color }) => (
              <div
                key={color}
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border-2 border-white/30"
              >
                <div
                  className={`w-6 h-6 rounded-full ${color === 'white' ? 'border-2 border-gray-400' : ''}`}
                  style={{ backgroundColor: color }}
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center text-xs font-bold">
                  {gameState.colorClicks[color]}
                </div>
              </div>
            ))}
            <div className="w-px h-6 bg-white/30 mx-2"></div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500/30 backdrop-blur-sm border-2 border-white/30">
              <span className={`${textColorClass} font-bold text-sm`}>{gameLogic.getRemainingMixes()}</span>
            </div>
          </div>

          {/* Color Buttons */}
          <div className="flex items-center justify-center space-x-4 mb-4 relative z-20">
            {colorButtons.map(({ color, bgColor, shadowColor, textColor = 'text-white' }) => (
              <Button
                key={color}
                onClick={() => handleColorClick(color)}
                disabled={gameLogic.getRemainingMixes() <= 0 || isPaused}
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${bgColor} ${shadowColor} shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/40 disabled:opacity-50 disabled:cursor-not-allowed ${textColor} pointer-events-auto`}
                style={{ zIndex: 50 }}
              />
            ))}
          </div>

          {/* Reset Button */}
          <Button
            onClick={handleResetLevel}
            variant="ghost"
            className={`bg-black/20 backdrop-blur-sm hover:bg-black/30 border border-white/30 rounded-xl px-4 py-2 transition-all duration-200 hover:scale-105 relative z-20 pointer-events-auto ${textColorClass}`}
          >
            <RotateCcw className={`w-4 h-4 mr-2`} />
            Reset
          </Button>
        </div>



        {/* Pause Overlay */}
        {isPaused && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Game Paused</h2>
              <Button
                onClick={() => setIsPaused(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Resume Game
              </Button>
            </div>
          </div>
        )}
      </div>

      <InstructionsModal
        open={showInstructions}
        onOpenChange={setShowInstructions}
        game="colormerge"
      />

      <GameOverModal
        open={showGameOver}
        onOpenChange={setShowGameOver}
        finalLevel={gameState.currentLevel}
        bestLevel={(stats as any)?.bestLevel || 0}
        onPlayAgain={() => {
          gameLogic.resetGame();
          setGameState(gameLogic.getState());
          setShowGameOver(false);
        }}
      />


    </>
  );
}
