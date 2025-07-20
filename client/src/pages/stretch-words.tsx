import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GameHeader from "@/components/game-header";
import GameStats from "@/components/game-stats";
import InstructionsModal from "@/components/instructions-modal";
import { generateStretchWordsLevel, calculateScore } from "@/lib/game-utils";
import { useGameStats } from "@/hooks/use-game-stats";
import { useToast } from "@/hooks/use-toast";

export default function StretchWords() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [transforms, setTransforms] = useState({
    scaleX: 2.5,
    scaleY: 1,
    skewX: 15,
    rotate: -5,
  });
  const { stats, updateStats } = useGameStats("stretchwords");
  const { toast } = useToast();

  useEffect(() => {
    generateLevel();
  }, [level]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft]);

  const generateLevel = () => {
    const { word, distortions } = generateStretchWordsLevel(level);
    setCurrentWord(word);
    setTransforms(distortions);
    setUserAnswer("");
    setTimeLeft(60);
  };

  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: `The word was "${currentWord}". Moving to next level.`,
      variant: "destructive",
    });
    setLevel(level + 1);
  };

  const handleTransformChange = (key: string, value: number) => {
    setTransforms(prev => ({ ...prev, [key]: value }));
  };

  const checkAnswer = () => {
    if (userAnswer.toUpperCase() === currentWord) {
      const timeUsed = 60 - timeLeft;
      const newScore = score + calculateScore("stretchwords", level, timeUsed, 100);
      setScore(newScore);
      setLevel(level + 1);
      
      updateStats({
        currentLevel: level + 1,
        bestLevel: Math.max(stats?.bestLevel || 0, level + 1),
        currentScore: newScore,
        bestScore: Math.max(stats?.bestScore || 0, newScore),
      });

      toast({
        title: "Correct! 🎉",
        description: `You found "${currentWord}"! Moving to level ${level + 1}`,
      });
    } else {
      toast({
        title: "Incorrect",
        description: "Keep adjusting the text to make it more readable.",
        variant: "destructive",
      });
    }
  };

  const resetWord = () => {
    const { distortions } = generateStretchWordsLevel(level);
    setTransforms(distortions);
    setUserAnswer("");
  };

  const getTransformStyle = () => {
    return {
      transform: `scaleX(${transforms.scaleX}) scaleY(${transforms.scaleY}) skewX(${transforms.skewX}deg) rotate(${transforms.rotate}deg)`,
      letterSpacing: `${Math.max(0, (transforms.scaleX - 1) * 10)}px`,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GameHeader
          title="Stretch Words"
          onInstructions={() => setShowInstructions(true)}
        />

        <GameStats stats={{
          score,
          level,
          timeLeft,
        }} />

        {/* Game Area */}
        <Card className="bg-white rounded-2xl p-8 shadow-xl">
          <CardContent className="pt-0">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600">Manipulate the text to reveal the hidden word!</p>
            </div>

            {/* Stretched Word Display */}
            <div className="bg-gray-50 rounded-xl p-8 mb-6 text-center overflow-hidden min-h-32 flex items-center justify-center">
              <div
                className="text-6xl font-bold text-gray-800 select-none cursor-move transition-transform duration-300"
                style={getTransformStyle()}
              >
                {currentWord}
              </div>
            </div>

            {/* Manipulation Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <Label className="block text-sm text-gray-600 mb-2">Stretch X</Label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={transforms.scaleX}
                  onChange={(e) => handleTransformChange('scaleX', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-game-error"
                />
              </div>
              <div className="text-center">
                <Label className="block text-sm text-gray-600 mb-2">Stretch Y</Label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={transforms.scaleY}
                  onChange={(e) => handleTransformChange('scaleY', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-game-error"
                />
              </div>
              <div className="text-center">
                <Label className="block text-sm text-gray-600 mb-2">Skew</Label>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={transforms.skewX}
                  onChange={(e) => handleTransformChange('skewX', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-game-error"
                />
              </div>
              <div className="text-center">
                <Label className="block text-sm text-gray-600 mb-2">Rotate</Label>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={transforms.rotate}
                  onChange={(e) => handleTransformChange('rotate', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-game-error"
                />
              </div>
            </div>

            {/* Answer Input */}
            <div className="text-center mb-6">
              <Input
                type="text"
                placeholder="Enter the word you see..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="text-xl text-center max-w-xs mx-auto border-2 focus:border-game-error"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    checkAnswer();
                  }
                }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={resetWord}
                variant="outline"
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                Reset
              </Button>
              <Button
                onClick={checkAnswer}
                className="bg-game-error text-white hover:bg-red-600"
                disabled={!userAnswer.trim()}
              >
                Check Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <InstructionsModal
        open={showInstructions}
        onOpenChange={setShowInstructions}
        game="stretchwords"
      />
    </div>
  );
}
