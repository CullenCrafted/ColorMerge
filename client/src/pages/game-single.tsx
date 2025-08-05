import { useRoute } from "wouter";
import { GameMode } from "@/lib/game-engine";
import UnifiedGameController from "@/components/unified-game-controller";

export default function GameSingle() {
  const [match, params] = useRoute("/game/:mode");
  
  if (!match || !params?.mode) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Invalid Game Mode</h2>
          <p>The requested game mode could not be found.</p>
        </div>
      </div>
    );
  }

  // Convert URL param to GameMode
  const modeMap: { [key: string]: GameMode } = {
    'classic': 'Classic',
    'golfball': 'GolfBall',
    'strings': 'Strings',
    'concentric': 'Concentric',
    'flashbg': 'FlashBG',
    'tetris': 'Tetris',
    'chaotic': 'Chaotic',
    'zenfade': 'ZenFade',
    'arcade': 'Classic' // Fallback for arcade
  };

  const gameMode = modeMap[params.mode.toLowerCase()] || 'Classic';
  
  if (params.mode.toLowerCase() === 'arcade') {
    return (
      <UnifiedGameController
        gameType="arcade"
        initialLevel={1}
      />
    );
  }

  return (
    <UnifiedGameController
      gameType="single"
      initialMode={gameMode}
      initialLevel={1}
    />
  );
}