import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameHeader from "@/components/game-header";
import GameStats from "@/components/game-stats";
import InstructionsModal from "@/components/instructions-modal";
import { generateWordScrambleLevel, calculateScore } from "@/lib/game-utils";
import { useGameStats } from "@/hooks/use-game-stats";
import { useToast } from "@/hooks/use-toast";

export default function WordScramble() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [currentWord, setCurrentWord] = useState("");
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [hints, setHints] = useState(3);
  const { stats, updateStats } = useGameStats("wordscramble");
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
    const { word, scrambled } = generateWordScrambleLevel(level);
    setCurrentWord(word);
    setScrambledLetters(scrambled);
    setSelectedLetters([]);
    setTimeLeft(120);
  };

  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: `The word was "${currentWord}". Moving to next level.`,
      variant: "destructive",
    });
    setLevel(level + 1);
  };

  const handleLetterClick = (index: number) => {
    if (selectedLetters.includes(index)) {
      setSelectedLetters(selectedLetters.filter(i => i !== index));
    } else {
      setSelectedLetters([...selectedLetters, index]);
    }
  };

  const getCurrentAttempt = () => {
    return selectedLetters.map(index => scrambledLetters[index]).join('');
  };

  const checkAnswer = () => {
    const attempt = getCurrentAttempt();
    if (attempt.toUpperCase() === currentWord) {
      const timeUsed = 120 - timeLeft;
      const newScore = score + calculateScore("wordscramble", level, timeUsed, 100);
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
        description: `You unscrambled "${currentWord}"! Moving to level ${level + 1}`,
      });
    } else {
      toast({
        title: "Incorrect",
        description: "Keep trying to unscramble the word.",
        variant: "destructive",
      });
    }
  };

  const useHint = () => {
    if (hints > 0) {
      setHints(hints - 1);
      const firstLetter = currentWord.charAt(0);
      const correctIndex = scrambledLetters.indexOf(firstLetter);
      if (correctIndex !== -1 && !selectedLetters.includes(correctIndex)) {
        setSelectedLetters([correctIndex]);
      }
      toast({
        title: "Hint",
        description: `The first letter is "${firstLetter}"`,
      });
    }
  };

  const clearSelection = () => {
    setSelectedLetters([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GameHeader
          title="Word Scramble"
          onInstructions={() => setShowInstructions(true)}
        />

        <GameStats stats={{
          score,
          level,
          timeLeft: Math.floor(timeLeft / 60),
          hints,
        }} />

        {/* Game Area */}
        <Card className="bg-white rounded-2xl p-8 shadow-xl">
          <CardContent className="pt-0">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600">Unscramble the letters to form a word!</p>
              <p className="text-sm text-gray-500 mt-2">Time: {formatTime(timeLeft)}</p>
            </div>

            {/* Current Attempt Display */}
            <div className="text-center mb-8">
              <div className="bg-gray-50 rounded-xl p-6 min-h-20 flex items-center justify-center">
                <div className="text-3xl font-bold text-gray-800 tracking-wider">
                  {getCurrentAttempt() || "Select letters..."}
                </div>
              </div>
            </div>

            {/* Scrambled Letters */}
            <div className="flex justify-center mb-8">
              <div className="flex flex-wrap gap-3 justify-center max-w-md">
                {scrambledLetters.map((letter, index) => (
                  <Button
                    key={index}
                    onClick={() => handleLetterClick(index)}
                    className={`w-16 h-16 text-2xl font-bold rounded-xl transition-all duration-200 ${
                      selectedLetters.includes(index)
                        ? 'bg-game-secondary text-white scale-110'
                        : 'bg-white border-2 border-gray-300 text-gray-800 hover:border-game-secondary hover:scale-105'
                    }`}
                  >
                    {letter}
                  </Button>
                ))}
              </div>
            </div>

            {/* Order Indicator */}
            {selectedLetters.length > 0 && (
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">Selected order:</p>
                <div className="flex justify-center space-x-2">
                  {selectedLetters.map((index, orderIndex) => (
                    <div
                      key={index}
                      className="w-8 h-8 bg-game-secondary text-white rounded-full flex items-center justify-center text-sm font-bold"
                    >
                      {orderIndex + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={useHint}
                disabled={hints <= 0}
                className="bg-game-warning text-white hover:bg-yellow-600"
              >
                Hint ({hints})
              </Button>
              <Button
                onClick={clearSelection}
                variant="outline"
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                Clear
              </Button>
              <Button
                onClick={checkAnswer}
                disabled={selectedLetters.length !== scrambledLetters.length}
                className="bg-game-secondary text-white hover:bg-purple-600"
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
        game="wordscramble"
      />
    </div>
  );
}
