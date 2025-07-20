import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface GameStatsProps {
  stats: {
    level?: number;
    score?: number;
    streak?: number;
    bestLevel?: number;
    bestScore?: number;
    hearts?: number;
    hints?: number;
    timeLeft?: number;
    targetWord?: string;
  };
}

export default function GameStats({ stats }: GameStatsProps) {
  return (
    <Card className="bg-white rounded-xl p-6 mb-8 shadow-lg">
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {stats.level !== undefined && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Level</p>
                <p className="text-2xl font-bold text-game-primary">{stats.level}</p>
              </div>
            )}
            {stats.score !== undefined && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Score</p>
                <p className="text-2xl font-bold text-game-success">{stats.score}</p>
              </div>
            )}
            {stats.streak !== undefined && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Streak</p>
                <p className="text-2xl font-bold text-game-warning">{stats.streak}</p>
              </div>
            )}
            {stats.bestLevel !== undefined && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Best Level</p>
                <p className="text-2xl font-bold text-game-info">{stats.bestLevel}</p>
              </div>
            )}
            {stats.bestScore !== undefined && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Best Score</p>
                <p className="text-2xl font-bold text-game-info">{stats.bestScore}</p>
              </div>
            )}
            {stats.hints !== undefined && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Hints</p>
                <p className="text-2xl font-bold text-game-warning">{stats.hints}</p>
              </div>
            )}
            {stats.timeLeft !== undefined && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-2xl font-bold text-game-error">{stats.timeLeft}s</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {stats.hearts !== undefined && (
              <>
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className={`heart-shape ${i < stats.hearts ? 'bg-red-500' : 'bg-gray-300'}`}
                  />
                ))}
              </>
            )}
            {stats.targetWord && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Target Word</p>
                <p className="text-xl font-bold text-gray-900">{stats.targetWord}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
