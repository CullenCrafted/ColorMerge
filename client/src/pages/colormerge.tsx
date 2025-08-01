import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle, RotateCcw, Pause, Volume2, VolumeX, Trophy, Heart } from "lucide-react";
import { ColorMergeLogic } from "@/lib/colormerge-logic";
import { useGameStats } from "@/hooks/use-game-stats";
import { useToast } from "@/hooks/use-toast";
import InstructionsModal from "@/components/instructions-modal";
import GameOverModal from "@/components/game-over-modal";
import LevelCompleteModal from "@/components/level-complete-modal";

export default function ColorMerge() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [gameLogic, setGameLogic] = useState<ColorMergeLogic>(new ColorMergeLogic());
  const [gameState, setGameState] = useState(gameLogic.getState());
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pulseTarget, setPulseTarget] = useState(false);
  const { stats, updateStats } = useGameStats("colormerge");
  const { toast } = useToast();

  useEffect(() => {
    if (stats) {
      const newLogic = new ColorMergeLogic((stats as any).currentLevel || 1, (stats as any).hearts || 3);
      setGameLogic(newLogic);
      setGameState(newLogic.getState());
    }
  }, [stats]);

  // Pulse target color when level starts
  useEffect(() => {
    setPulseTarget(true);
    const timer = setTimeout(() => setPulseTarget(false), 2000);
    return () => clearTimeout(timer);
  }, [gameState.currentLevel]);

  const handleColorClick = (color: string) => {
    if (isPaused) return;
    
    const result = gameLogic.addColor(color);
    const newState = gameLogic.getState();
    setGameState(newState);

    if (result.bonusHeart) {
      toast({
        title: "Perfect! Bonus Heart Earned",
        description: "You solved it with extra moves remaining!",
      });
    }

    if (result.levelComplete) {
      updateStats({
        currentLevel: newState.currentLevel,
        bestLevel: Math.max((stats as any)?.bestLevel || 0, newState.currentLevel),
        hearts: newState.hearts,
        streak: newState.currentStreak,
        totalPlays: ((stats as any)?.totalPlays || 0) + 1,
      });
      setShowLevelComplete(true);
    }

    if (result.gameOver) {
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

  return (
    <>
      {/* Full Background with Target Color */}
      <div 
        className="fixed inset-0 transition-all duration-1000 ease-out"
        style={{ 
          backgroundColor: gameLogic.getTargetColorString(),
          opacity: 0.15
        }}
      />
      
      <div className="min-h-screen relative z-10">
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
        <div className="flex items-center justify-between p-6 relative z-20">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ColorMerge
            </h1>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-semibold text-gray-700">{(stats as any)?.bestLevel || 0}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 relative z-30 pointer-events-auto"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button
              onClick={() => setIsPaused(!isPaused)}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 relative z-30 pointer-events-auto"
            >
              <Pause className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setShowInstructions(true)}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 relative z-30 pointer-events-auto"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="flex items-center justify-center space-x-8 mb-8 relative z-20">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{gameState.currentLevel}</div>
            <div className="text-sm text-gray-600">Level</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{gameState.currentStreak}</div>
            <div className="text-sm text-gray-600">Streak</div>
          </div>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: 3 }, (_, i) => (
              <Heart
                key={i}
                className={`w-8 h-8 ${i < gameState.hearts ? 'text-red-500 fill-current' : 'text-gray-300'} transition-all duration-300`}
              />
            ))}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex flex-col items-center px-6 relative z-20">
          {/* Target Color Display */}
          <div className="text-center mb-12">
            <p className="text-lg text-gray-700 mb-6 font-medium">Match this color</p>
            <div className="relative">
              <div
                className={`w-64 h-64 rounded-full shadow-2xl border-4 border-white/50 backdrop-blur-sm transition-all duration-500 ${pulseTarget ? 'animate-pulse scale-110' : ''}`}
                style={{ 
                  backgroundColor: gameLogic.getTargetColorString(),
                  boxShadow: `0 20px 40px ${gameLogic.getTargetColorString()}40, inset 0 0 20px rgba(255,255,255,0.2)`
                }}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
            </div>
          </div>

          {/* Current Mix Display */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 mb-4 font-medium">Your mix</p>
            <div className="relative">
              <div
                className="w-40 h-40 rounded-full shadow-xl border-4 border-white/50 transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: gameLogic.getCurrentColorString(),
                  boxShadow: `0 15px 30px ${gameLogic.getCurrentColorString()}30, inset 0 0 15px rgba(255,255,255,0.2)`
                }}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
            </div>
          </div>

          {/* Mix Progress Indicator */}
          <div className="flex items-center justify-center space-x-3 mb-12 bg-white/30 backdrop-blur-lg rounded-2xl p-4 border border-white/40">
            {colorButtons.map(({ color }) => (
              <div
                key={color}
                className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30"
              >
                <div
                  className={`w-8 h-8 rounded-full ${color === 'white' ? 'border-2 border-gray-300' : ''}`}
                  style={{ backgroundColor: color }}
                />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {gameState.colorClicks[color]}
                </div>
              </div>
            ))}
            <div className="w-px h-8 bg-white/30 mx-2"></div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-500/30 backdrop-blur-sm border-2 border-white/30">
              <span className="text-white font-bold">{gameLogic.getRemainingMixes()}</span>
            </div>
          </div>

          {/* Color Buttons */}
          <div className="flex items-center justify-center space-x-6 mb-8 relative z-20">
            {colorButtons.map(({ color, bgColor, shadowColor, textColor = 'text-white' }) => (
              <Button
                key={color}
                onClick={() => handleColorClick(color)}
                disabled={gameLogic.getRemainingMixes() <= 0 || isPaused}
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${bgColor} ${shadowColor} shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/30 disabled:opacity-50 disabled:cursor-not-allowed ${textColor} pointer-events-auto`}
                style={{ zIndex: 50 }}
              />
            ))}
          </div>

          {/* Reset Button */}
          <Button
            onClick={handleResetLevel}
            variant="ghost"
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 rounded-xl px-6 py-3 transition-all duration-200 hover:scale-105 relative z-20 pointer-events-auto"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset Level
          </Button>
        </div>

        {/* Pause Overlay */}
        {isPaused && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-center mb-4">Game Paused</h2>
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

      <LevelCompleteModal
        open={showLevelComplete}
        onOpenChange={setShowLevelComplete}
        level={gameState.currentLevel}
        streak={gameState.currentStreak}
        hearts={gameState.hearts}
        onContinue={() => setShowLevelComplete(false)}
      />
    </>
  );
}
