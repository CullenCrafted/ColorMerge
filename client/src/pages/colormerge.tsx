import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, RotateCcw, Pause, Volume2, VolumeX, Trophy, Heart, Zap } from "lucide-react";
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
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [lastGuess, setLastGuess] = useState<string[]>([]);
  const [allIncorrectGuesses, setAllIncorrectGuesses] = useState<Array<{guess: string[], correct: string[], level: number}>>([]);
  const [enhancedHaptics, setEnhancedHaptics] = useState(false);
  const { stats, updateStats } = useGameStats("colormerge");
  const { toast } = useToast();

  // Haptic feedback function
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const basePatterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      const enhancedPatterns = {
        light: [15, 5, 15],
        medium: [30, 10, 30],
        heavy: [80, 20, 80, 20, 80]
      };
      const patterns = enhancedHaptics ? enhancedPatterns : basePatterns;
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
    
    // Store the guess before adding the color
    const currentGuess = [...Object.entries(gameState.colorClicks)
      .filter(([_, count]) => count > 0)
      .flatMap(([color, count]) => Array(count).fill(color))];
    currentGuess.push(color);
    setLastGuess(currentGuess);
    
    const result = gameLogic.addColor(color);
    const newState = gameLogic.getState();
    setGameState(newState);

    // Check for heart changes
    if (newState.hearts < previousHeartCount) {
      // Heart lost - store incorrect guess for final summary
      triggerHaptic('heavy');
      setShowHeartLoss(true);
      
      const newIncorrectGuess = {
        guess: currentGuess,
        correct: gameLogic.getCurrentTargetColorArray(),
        level: gameState.currentLevel
      };
      setAllIncorrectGuesses(prev => [...prev, newIncorrectGuess]);
      
      setTimeout(() => {
        setShowHeartLoss(false);
      }, 1500);
    }

    if (result.levelComplete) {
      // Success haptic and flash
      triggerHaptic('heavy');
      setShowSuccessFlash(true);
      
      // Stay on success screen longer
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
      }, 1500); // Increased from 800ms

      // Update stats with proper streak increment
      updateStats({
        currentLevel: newState.currentLevel,
        bestLevel: Math.max((stats as any)?.bestLevel || 0, newState.currentLevel),
        hearts: newState.hearts,
        streak: newState.currentStreak,
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
      const finalLevel = gameState.currentLevel;
      const currentBest = (stats as any)?.bestLevel || 0;
      
      updateStats({
        currentLevel: 1,
        hearts: 3,
        bestLevel: Math.max(finalLevel, currentBest), // Update all-time best
        totalPlays: ((stats as any)?.totalPlays || 0) + 1,
      });
      setShowGameOver(true);
    }
  };

  const handleResetLevel = () => {
    gameLogic.resetLevel();
    setGameState(gameLogic.getState());
  };

  const handleNewGame = () => {
    gameLogic.resetGame();
    setGameState(gameLogic.getState());
    setAllIncorrectGuesses([]);
    setShowGameOver(false);
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

  // Pie chart component for showing color mixtures
  const ColorPieChart = ({ colors, size = 80 }: { colors: string[]; size?: number }) => {
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
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {Object.entries(colorCounts).map(([color, count]) => (
            <div key={color} className="flex items-center text-xs bg-black/20 backdrop-blur rounded px-2 py-1">
              <div 
                className="w-3 h-3 rounded-full mr-1 border border-white/50" 
                style={{ backgroundColor: color }}
              />
              <span className={textColorClass}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Full Background with Target Color */}
      <div 
        className="fixed inset-0 transition-all duration-1000 ease-out"
        style={{ 
          backgroundColor: gameLogic.getTargetColorString()
        }}
      />
      
      <div className={`h-screen flex flex-col relative z-10 overflow-hidden transition-all duration-300 ${
        showSuccessFlash ? 'ring-8 ring-green-400/50' : showHeartLoss ? 'ring-8 ring-red-500/50' : ''
      }`}>
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
        <div className="flex items-center justify-center p-4 relative z-20">
          <div className="flex items-center space-x-6">
            {/* Left side buttons */}
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
                onClick={() => setEnhancedHaptics(!enhancedHaptics)}
                variant="ghost"
                size="sm"
                className={`w-10 h-10 rounded-full backdrop-blur-sm hover:bg-black/30 relative z-30 pointer-events-auto ${
                  enhancedHaptics ? 'bg-yellow-500/30' : 'bg-black/20'
                }`}
              >
                <Zap className={`w-5 h-5 ${textColorClass}`} />
              </Button>
            </div>

            {/* Center - Title and Stats */}
            <div className="flex flex-col items-center space-y-3">
              <h1 className={`text-3xl font-bold drop-shadow-lg transition-all duration-300 ${
                showSuccessFlash ? 'text-green-400 scale-110' : textColorClass
              }`}>
                ColorMerge
              </h1>
              <div className="flex items-center space-x-6">
                {/* Best Score */}
                <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                  <Trophy className="w-5 h-5 text-yellow-400 mb-1" />
                  <span className={`text-xs ${textColorClass} opacity-70`}>Best</span>
                  <span className={`text-lg font-bold ${textColorClass}`}>{(stats as any)?.bestLevel || 0}</span>
                </div>
                
                {/* Current Level */}
                <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                  <div className="w-5 h-5 bg-blue-400 rounded-full mb-1 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{gameState.currentLevel}</span>
                  </div>
                  <span className={`text-xs ${textColorClass} opacity-70`}>Level</span>
                  <span className={`text-lg font-bold ${textColorClass}`}>{gameState.currentLevel}</span>
                </div>
                

                
                {/* Hearts */}
                <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20 relative">
                  <Heart className="w-5 h-5 text-red-400 fill-current mb-1" />
                  <span className={`text-xs ${textColorClass} opacity-70`}>Hearts</span>
                  <span className={`text-lg font-bold ${textColorClass}`}>{gameState.hearts}</span>
                  {showHeartLoss && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                      <span className="text-xl text-red-500 font-bold drop-shadow-lg bg-black/50 rounded-full px-2 py-1">-1</span>
                    </div>
                  )}
                  {showHeartGain && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                      <span className="text-xl text-green-500 font-bold drop-shadow-lg bg-black/50 rounded-full px-2 py-1">+1</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsPaused(!isPaused)}
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 relative z-30 pointer-events-auto"
              >
                <Pause className={`w-5 h-5 ${textColorClass}`} />
              </Button>
              <Button
                onClick={handleResetLevel}
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 relative z-30 pointer-events-auto"
              >
                <RotateCcw className={`w-5 h-5 ${textColorClass}`} />
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
        incorrectGuesses={allIncorrectGuesses}
        onPlayAgain={handleNewGame}
      />


    </>
  );
}
