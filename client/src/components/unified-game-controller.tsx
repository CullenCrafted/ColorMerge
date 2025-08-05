import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { GameEngine, GameSettings, GameMode } from "@/lib/game-engine";
import GameModeTransition from "@/components/game-mode-transition";

// Import all game mode components
import ClassicMode from "@/components/game-modes/classic-mode";
import GolfBallMode from "@/components/game-modes/golfball-mode";
import StringsMode from "@/components/game-modes/strings-mode";
import ConcentricMode from "@/components/game-modes/concentric-mode";
import FlashBGMode from "@/components/game-modes/flash-bg-mode";
import TetrisMode from "@/components/game-modes/tetris-mode";
import ChaoticMode from "@/components/game-modes/chaotic-mode";
import ZenFadeMode from "@/components/game-modes/zen-fade-mode";

interface UnifiedGameControllerProps {
  gameType: 'single' | 'arcade';
  initialMode?: GameMode;
  initialLevel?: number;
}

export default function UnifiedGameController({ 
  gameType, 
  initialMode = 'Classic',
  initialLevel = 1 
}: UnifiedGameControllerProps) {
  const [, setLocation] = useLocation();
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [showTransition, setShowTransition] = useState(true);
  const [isGameActive, setIsGameActive] = useState(false);

  // Initialize game settings
  useEffect(() => {
    if (gameType === 'single') {
      // Single mode - just play the selected mode at level 1
      const settings: GameSettings = {
        level: 1,
        game_mode: initialMode,
        GDI: 1.15,
        settings: GameEngine['generateSettings'](initialMode, 1.15)
      };
      setGameSettings(settings);
    } else {
      // Arcade mode - generate level based on progression
      const settings = GameEngine.generateLevel(currentLevel);
      setGameSettings(settings);
    }
  }, [gameType, initialMode, currentLevel]);

  const handleTransitionComplete = () => {
    setShowTransition(false);
    setIsGameActive(true);
  };

  const handleGameComplete = (success: boolean, score: number) => {
    if (success) {
      if (gameType === 'arcade') {
        // Move to next level in arcade mode
        setCurrentLevel(prev => prev + 1);
        setShowTransition(true);
        setIsGameActive(false);
      } else {
        // Single mode complete - return to menu
        setLocation('/');
      }
    }
  };

  const handleGameOver = () => {
    // Game over - return to menu
    setLocation('/');
  };

  if (!gameSettings) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading game...</p>
        </div>
      </div>
    );
  }

  const renderGameMode = () => {
    const props = {
      gameSettings,
      onComplete: handleGameComplete,
      onGameOver: handleGameOver
    };

    switch (gameSettings.game_mode) {
      case 'Classic':
        return <ClassicMode {...props} />;
      case 'GolfBall':
        return <GolfBallMode {...props} />;
      case 'Strings':
        return <StringsMode {...props} />;
      case 'Concentric':
        return <ConcentricMode {...props} />;
      case 'FlashBG':
        return <FlashBGMode {...props} />;
      case 'Tetris':
        return <TetrisMode {...props} />;
      case 'Chaotic':
        return <ChaoticMode {...props} />;
      case 'ZenFade':
        return <ZenFadeMode {...props} />;
      default:
        return <ClassicMode {...props} />;
    }
  };

  return (
    <div className="relative">
      {/* Game Mode Transition */}
      <GameModeTransition
        gameMode={gameSettings.game_mode}
        level={gameSettings.level}
        onComplete={handleTransitionComplete}
        show={showTransition}
      />

      {/* Active Game */}
      {isGameActive && renderGameMode()}
    </div>
  );
}