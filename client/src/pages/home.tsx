import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, BarChart3, Star, Clock, CheckCircle, Zap, Target } from "lucide-react";
import StatisticsModal from "@/components/statistics-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [showStats, setShowStats] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const { data: challenges } = useQuery({
    queryKey: ["/api/challenges", today],
  });

  const handleSubscribe = async () => {
    try {
      await apiRequest("POST", "/api/subscribe", { email });
      toast({
        title: "Success!",
        description: "You've been subscribed to daily challenges.",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    }
  };

  const games = [
    {
      id: "colormerge",
      name: "ColorMerge",
      description: "Mix colors to match the target background. Master the art of color theory!",
      route: "/colormerge",
      gradient: "from-blue-400 via-purple-500 to-pink-500",
      icon: <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-red-500"></div>
      </div>,
      badge: "Classic",
      stats: { bestScore: "Level 25", hearts: 3 }
    },
    {
      id: "connectlines",
      name: "Connect Lines",
      description: "Draw lines to connect scattered dots and reveal hidden words and images!",
      route: "/connect-lines",
      gradient: "from-green-400 via-teal-500 to-blue-500",
      icon: <svg className="w-16 h-16 text-white/60" fill="currentColor" viewBox="0 0 100 100">
        <circle cx="20" cy="20" r="3"></circle>
        <circle cx="80" cy="30" r="3"></circle>
        <circle cx="30" cy="60" r="3"></circle>
        <circle cx="70" cy="80" r="3"></circle>
        <path d="M20 20 L30 60 L70 80 L80 30" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="5,5"></path>
      </svg>,
      badge: "New",
      stats: { bestScore: "1,250 pts", rating: "4.8" }
    },
    {
      id: "stretchwords",
      name: "Stretch Words",
      description: "Manipulate stretched and distorted text to reveal the hidden words!",
      route: "/stretch-words",
      gradient: "from-orange-400 via-red-500 to-pink-500",
      icon: <div className="text-white/60 text-4xl font-bold transform skew-x-12 scale-x-150">
        WORD
      </div>,
      badge: "New",
      stats: { bestScore: "2,150 pts", accuracy: "85%" }
    },
    {
      id: "wordscramble",
      name: "Word Scramble",
      description: "Unscramble letters to form words. Race against time for bonus points!",
      route: "/word-scramble",
      gradient: "from-purple-400 via-indigo-500 to-blue-500",
      icon: <div className="grid grid-cols-4 gap-2">
        {['P', 'L', 'A', 'Y'].map((letter, i) => (
          <div key={i} className="w-8 h-8 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold">{letter}</div>
        ))}
      </div>,
      badge: "Popular",
      stats: { bestScore: "3,200 pts", avgTime: "2:34" }
    },
    {
      id: "letterpath",
      name: "Letter Path",
      description: "Find word paths through a grid of letters. Create chains for higher scores!",
      route: "/letter-path",
      gradient: "from-teal-400 via-cyan-500 to-blue-500",
      icon: <div className="grid grid-cols-3 gap-1">
        {['H', 'E', 'L', 'P', 'A', 'T', 'H', 'S', '!'].map((letter, i) => (
          <div key={i} className="w-6 h-6 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm font-bold">{letter}</div>
        ))}
      </div>,
      badge: "Challenge",
      stats: { bestScore: "4,450 pts", level: "Master" }
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-game-primary to-game-secondary bg-clip-text text-transparent">
                GameHub
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(true)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <BarChart3 className="w-5 h-5 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Daily Brain Games
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Challenge yourself with our collection of color mixing and word puzzle games. 
            Perfect your skills and compete in daily challenges!
          </p>
          
          {/* Daily Challenge Banner */}
          <Card className="bg-gradient-to-r from-game-primary to-game-secondary rounded-2xl p-6 mb-8 text-white shadow-xl border-0">
            <CardContent className="pt-0">
              <div className="flex items-center justify-center space-x-4">
                <Star className="w-8 h-8 text-yellow-300" />
                <div>
                  <h3 className="text-2xl font-bold">Today's Challenge</h3>
                  <p className="text-blue-100">Complete 3 games to earn bonus points!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription CTA */}
          <Card className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <CardContent className="pt-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Never Miss a Challenge</h3>
              <p className="text-gray-600 mb-4">Get daily game challenges delivered to your inbox</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={handleSubscribe} className="bg-game-primary hover:bg-indigo-700">
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {games.map((game) => (
            <Link key={game.id} href={game.route}>
              <Card className="game-card bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer">
                <div className={`h-48 bg-gradient-to-br ${game.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {game.icon}
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0">
                      {game.badge}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{game.name}</h3>
                  <p className="text-gray-600 mb-4">{game.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Best Score:</span>
                      <span className="font-semibold text-game-primary">{game.stats.bestScore}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {game.id === 'colormerge' && (
                        <>
                          <div className="heart-shape w-4 h-4"></div>
                          <span className="text-sm font-medium">{game.stats.hearts}</span>
                        </>
                      )}
                      {game.stats.rating && (
                        <>
                          <Star className="w-4 h-4 text-game-warning" />
                          <span className="text-sm font-medium text-yellow-600">{game.stats.rating}</span>
                        </>
                      )}
                      {game.stats.accuracy && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">{game.stats.accuracy}</span>
                        </>
                      )}
                      {game.stats.avgTime && (
                        <>
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-600">{game.stats.avgTime}</span>
                        </>
                      )}
                      {game.stats.level && (
                        <>
                          <Target className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-600">{game.stats.level}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Daily Challenge Card */}
          <Card className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-xl overflow-hidden game-card cursor-pointer">
            <CardContent className="p-8 text-white text-center">
              <div className="mb-4">
                <Zap className="w-16 h-16 mx-auto text-white/80" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Daily Challenges</h3>
              <p className="text-orange-100 mb-4">Special puzzles updated daily with exclusive rewards!</p>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm font-medium">Today: Color Marathon</p>
                <p className="text-xs text-orange-100">Complete 15 levels in ColorMerge</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <StatisticsModal open={showStats} onOpenChange={setShowStats} />
    </div>
  );
}
