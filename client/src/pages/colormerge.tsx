import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameHeader from "@/components/game-header";
import GameStats from "@/components/game-stats";
import InstructionsModal from "@/components/instructions-modal";
import { ColorMergeLogic } from "@/lib/colormerge-logic";
import { useGameStats } from "@/hooks/use-game-stats";
import { useToast } from "@/hooks/use-toast";

export default function ColorMerge() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [gameLogic, setGameLogic] = useState<ColorMergeLogic>(new ColorMergeLogic());
  const [gameState, setGameState] = useState(gameLogic.getState());
  const { stats, updateStats } = useGameStats("colormerge");
  const { toast } = useToast();

  useEffect(() => {
    if (stats) {
      const newLogic = new ColorMergeLogic(stats.currentLevel || 1, stats.hearts || 3);
      setGameLogic(newLogic);
      setGameState(newLogic.getState());
    }
  }, [stats]);

  const handleColorClick = (color: string) => {
    const result = gameLogic.addColor(color);
    const newState = gameLogic.getState();
    setGameState(newState);

    if (result.bonusHeart) {
      toast({
        title: "Bonus Heart! 🎉",
        description: "You solved it early and earned an extra heart!",
      });
    }

    if (result.levelComplete) {
      updateStats({
        currentLevel: newState.currentLevel,
        bestLevel: Math.max(stats?.bestLevel || 0, newState.currentLevel),
        hearts: newState.hearts,
        streak: newState.currentStreak,
        totalPlays: (stats?.totalPlays || 0) + 1,
      });
    }

    if (result.gameOver) {
      updateStats({
        currentLevel: 1,
        hearts: 3,
        streak: 0,
        totalPlays: (stats?.totalPlays || 0) + 1,
      });
      toast({
        title: "Game Over",
        description: "No more hearts left! Starting over...",
        variant: "destructive",
      });
    }
  };

  const handleResetLevel = () => {
    gameLogic.resetLevel();
    setGameState(gameLogic.getState());
  };

  const colorButtons = [
    { color: 'blue', bgColor: 'bg-blue-500' },
    { color: 'red', bgColor: 'bg-red-500' },
    { color: 'yellow', bgColor: 'bg-yellow-400' },
    { color: 'white', bgColor: 'bg-white border-2 border-gray-400' },
    { color: 'black', bgColor: 'bg-black' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GameHeader
          title="ColorMerge"
          onInstructions={() => setShowInstructions(true)}
        />

        <GameStats stats={{
          level: gameState.currentLevel,
          streak: gameState.currentStreak,
          bestLevel: stats?.bestLevel || 0,
          hearts: gameState.hearts,
        }} />

        {/* Level Progress */}
        <Card className="bg-white rounded-xl p-4 mb-8 shadow-lg">
          <CardContent className="pt-0">
            <div className="flex items-center justify-center space-x-2">
              {Array.from({ length: 5 }, (_, i) => {
                const level = gameState.currentLevel + i - 2;
                const isCurrent = i === 2;
                const isCompleted = level < gameState.currentLevel;
                const isHeartLevel = level % 10 === 0;
                
                return (
                  <div
                    key={i}
                    className={`
                      w-3 h-3 rounded-full transition-all duration-300
                      ${isCurrent ? 'w-4 h-4 bg-white border-2 border-game-primary' : ''}
                      ${isCompleted ? 'bg-game-success' : 'bg-gray-300'}
                      ${isHeartLevel && level > 0 ? 'bg-red-500' : ''}
                    `}
                  >
                    {isCurrent && (
                      <div className="w-2 h-2 bg-game-primary rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Game Area */}
        <Card className="bg-white rounded-2xl p-8 shadow-xl">
          <CardContent className="pt-0">
            {/* Target Display */}
            <div className="text-center mb-8">
              <p className="text-lg text-gray-600 mb-4">Match this color:</p>
              <div
                className="w-48 h-48 mx-auto rounded-full shadow-xl border-4 border-white"
                style={{ backgroundColor: gameLogic.getTargetColorString() }}
              />
            </div>

            {/* Current Mix Display */}
            <div className="text-center mb-8">
              <p className="text-lg text-gray-600 mb-4">Your mix:</p>
              <div
                className="w-32 h-32 mx-auto rounded-full shadow-lg border-4 border-white"
                style={{ backgroundColor: gameLogic.getCurrentColorString() }}
              />
            </div>

            {/* Mix Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-4">
                {colorButtons.map(({ color, bgColor }) => (
                  <div
                    key={color}
                    className={`mix-indicator-dot ${bgColor} ${color === 'yellow' ? 'text-black' : 'text-white'}`}
                  >
                    {gameState.colorClicks[color]}
                  </div>
                ))}
                <div className="mix-indicator-dot bg-gray-400">
                  {gameLogic.getRemainingMixes()}
                </div>
              </div>
            </div>

            {/* Color Buttons */}
            <div className="flex justify-center space-x-4 mb-8">
              {colorButtons.map(({ color, bgColor }) => (
                <Button
                  key={color}
                  onClick={() => handleColorClick(color)}
                  className={`color-button ${bgColor}`}
                  disabled={gameLogic.getRemainingMixes() <= 0}
                />
              ))}
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <Button
                onClick={handleResetLevel}
                variant="outline"
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                Reset Level
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <InstructionsModal
        open={showInstructions}
        onOpenChange={setShowInstructions}
        game="colormerge"
      />
    </div>
  );
}
