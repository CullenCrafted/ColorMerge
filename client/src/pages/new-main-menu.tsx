import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, BarChart3, Star, Play, Trophy, Infinity } from "lucide-react";
import { GameEngine, GameMode } from "@/lib/game-engine";

export default function NewMainMenu() {
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const gameIcons = {
    Classic: (
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm border-2 border-white/50"></div>
      </div>
    ),
    Arcade: (
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
        <Infinity className="w-8 h-8 text-white" />
      </div>
    ),
    GolfBall: (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-300 shadow-2xl relative">
        <div className="absolute inset-2 rounded-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-gray-400 rounded-full"
              style={{
                top: `${30 + Math.sin((i * 45) * Math.PI / 180) * 20}%`,
                left: `${30 + Math.cos((i * 45) * Math.PI / 180) * 20}%`,
              }}
            />
          ))}
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
      <div className="w-16 h-16 rounded-lg overflow-hidden relative">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600"
          animate={{ 
            opacity: [1, 0.3, 1, 0.3, 1],
            scale: [1, 1.1, 1, 1.1, 1]
          }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-lg font-bold">?</div>
        </div>
      </div>
    ),
    Tetris: (
      <div className="w-16 h-16 relative">
        <motion.div 
          className="absolute top-0 left-2 w-3 h-3 bg-red-500 rounded"
          animate={{ y: [0, 40] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        />
        <motion.div 
          className="absolute top-0 left-6 w-3 h-3 bg-blue-500 rounded"
          animate={{ y: [0, 40] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear", delay: 0.5 }}
        />
        <motion.div 
          className="absolute top-0 right-2 w-3 h-3 bg-green-500 rounded"
          animate={{ y: [0, 40] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear", delay: 1 }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded"></div>
      </div>
    ),
    Chaotic: (
      <div className="w-16 h-16 relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400'][i]
            }`}
            animate={{
              x: [8, 48, 24, 56, 8],
              y: [8, 48, 24, 56, 8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    ),
    ZenFade: (
      <div className="w-16 h-16 rounded-full overflow-hidden relative">
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
              "linear-gradient(45deg, #4ecdc4, #45b7d1)",
              "linear-gradient(45deg, #45b7d1, #6c5ce7)",
              "linear-gradient(45deg, #6c5ce7, #ff6b6b)"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-black/10"></div>
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
      description: "Infinite progression through all game modes with escalating difficulty",
      route: "/game/arcade",
      badge: "Infinite",
      featured: true
    }
  ];

  const allGameModes = GameEngine.getAllGameModes().filter(mode => !['Classic'].includes(mode)).map(mode => ({
    id: mode,
    name: GameEngine.getGameModeDisplayName(mode),
    description: GameEngine.getGameModeDescription(mode),
    route: `/game/${mode.toLowerCase()}`,
    badge: "Challenge"
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
                transition={{ delay: 0.1 * index }}
                onHoverStart={() => setHoveredGame(game.id)}
                onHoverEnd={() => setHoveredGame(null)}
              >
                <Link href={game.route}>
                  <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group h-full">
                    <div className={`h-32 bg-gradient-to-br ${gameGradients[game.id as keyof typeof gameGradients]} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                        <div className="scale-75">
                          {gameIcons[game.id as keyof typeof gameIcons]}
                        </div>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                          {game.badge}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2">{game.name}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{game.description}</p>
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