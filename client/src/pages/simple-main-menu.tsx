import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameEngine, GameMode } from "@/lib/game-engine";
import { Play, Star, Trophy, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SimpleMainMenu() {
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  // Simple game icons without complex animations
  const gameIcons = {
    Classic: (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/30"></div>
      </div>
    ),
    Arcade: (
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">∞</div>
      </div>
    ),
    GolfBall: (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 relative">
        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        </div>
      </div>
    ),
    Strings: (
      <div className="w-16 h-16 relative">
        <svg className="w-full h-full" viewBox="0 0 64 64">
          <path d="M8 16 Q24 32 40 16 Q56 0 56 16" stroke="#ff6b6b" strokeWidth="3" fill="none" />
          <path d="M8 32 Q24 48 40 32 Q56 16 56 32" stroke="#4ecdc4" strokeWidth="3" fill="none" />
          <path d="M8 48 Q24 32 40 48 Q56 64 56 48" stroke="#45b7d1" strokeWidth="3" fill="none" />
        </svg>
      </div>
    ),
    Concentric: (
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 to-pink-500"></div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
        <div className="absolute inset-4 rounded-full bg-gradient-to-r from-green-400 to-teal-500"></div>
        <div className="absolute inset-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
      </div>
    ),
    FlashBG: (
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-lg font-bold">?</div>
      </div>
    ),
    Tetris: (
      <div className="w-16 h-16 relative bg-gradient-to-br from-green-400 to-blue-500 rounded-lg">
        <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded"></div>
        <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 bg-green-500 rounded"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded"></div>
      </div>
    ),
    Chaotic: (
      <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-red-400"></div>
        <div className="absolute top-4 right-3 w-2 h-2 rounded-full bg-blue-400"></div>
        <div className="absolute bottom-3 left-4 w-2 h-2 rounded-full bg-green-400"></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-yellow-400"></div>
      </div>
    ),
    ZenFade: (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 relative">
        <div className="absolute inset-0 bg-black/10 rounded-full"></div>
      </div>
    )
  };

  const gameGradients = {
    Classic: "from-blue-400 via-purple-500 to-pink-500",
    Arcade: "from-yellow-400 via-orange-500 to-red-500",
    GolfBall: "from-gray-100 via-white to-gray-200",
    Strings: "from-pink-400 via-red-500 to-orange-500",
    Concentric: "from-indigo-400 via-purple-500 to-pink-500",
    FlashBG: "from-yellow-400 via-red-500 to-purple-600",
    Tetris: "from-green-400 via-teal-500 to-blue-500",
    Chaotic: "from-gray-700 via-gray-800 to-black",
    ZenFade: "from-teal-400 via-cyan-500 to-blue-500"
  };

  const featuredGames = [
    {
      id: "Classic",
      name: "Classic Mode",
      description: GameEngine.getGameModeDescription("Classic" as GameMode),
      route: "/game/classic",
      badge: "Original",
      featured: true
    },
    {
      id: "Arcade",
      name: "Arcade Mode",
      description: GameEngine.getGameModeDescription("Classic" as GameMode) + " Experience all modes in infinite progression!",
      route: "/game/arcade",
      badge: "Infinite",
      featured: true
    }
  ];

  const allGameModes = [
    {
      id: "GolfBall",
      name: "Golf Ball Mode",
      description: GameEngine.getGameModeDescription("GolfBall" as GameMode),
      route: "/game/golfball"
    },
    {
      id: "Strings",
      name: "Strings Mode", 
      description: GameEngine.getGameModeDescription("Strings" as GameMode),
      route: "/game/strings"
    },
    {
      id: "Concentric",
      name: "Concentric Mode",
      description: GameEngine.getGameModeDescription("Concentric" as GameMode),
      route: "/game/concentric"
    },
    {
      id: "FlashBG",
      name: "Flash Background Mode",
      description: GameEngine.getGameModeDescription("FlashBG" as GameMode),
      route: "/game/flashbg"
    },
    {
      id: "Tetris",
      name: "Tetris Mode",
      description: GameEngine.getGameModeDescription("Tetris" as GameMode),
      route: "/game/tetris"
    },
    {
      id: "Chaotic",
      name: "Chaotic Mode",
      description: GameEngine.getGameModeDescription("Chaotic" as GameMode),
      route: "/game/chaotic"
    },
    {
      id: "ZenFade",
      name: "Zen Fade Mode",
      description: GameEngine.getGameModeDescription("ZenFade" as GameMode),
      route: "/game/zenfade"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6"
            >
              ColorMerge
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            >
              Master the art of color blending across multiple challenging game modes.
              From classic mixing to chaotic bouncing shapes - your color skills await!
            </motion.p>

            <div className="flex justify-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Statistics
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Games */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Star className="w-8 h-8 text-yellow-400 mr-3" />
            Featured Modes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredGames.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onHoverStart={() => setHoveredGame(game.id)}
                onHoverEnd={() => setHoveredGame(null)}
              >
                <Link href={game.route}>
                  <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group h-full">
                    <div className={`h-48 bg-gradient-to-br ${gameGradients[game.id as keyof typeof gameGradients]} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                        {gameIcons[game.id as keyof typeof gameIcons]}
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0">
                          {game.badge}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-white mb-3">{game.name}</h3>
                      <p className="text-gray-300 mb-4 leading-relaxed">{game.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Click to play</span>
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* All Game Modes */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">All Game Modes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allGameModes.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Link href={game.route}>
                  <Card className="bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group">
                    <div className={`h-32 bg-gradient-to-br ${gameGradients[game.id as keyof typeof gameGradients]} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                        {gameIcons[game.id as keyof typeof gameIcons]}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2">{game.name}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{game.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}