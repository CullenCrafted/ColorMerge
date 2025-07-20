import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GameHeader from "@/components/game-header";
import GameStats from "@/components/game-stats";
import InstructionsModal from "@/components/instructions-modal";
import { generateLetterPathLevel, calculateScore, isValidWord } from "@/lib/game-utils";
import { useGameStats } from "@/hooks/use-game-stats";
import { useToast } from "@/hooks/use-toast";

interface Position {
  row: number;
  col: number;
}

export default function LetterPath() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<string[][]>([]);
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<Position[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const { stats, updateStats } = useGameStats("letterpath");
  const { toast } = useToast();

  useEffect(() => {
    generateLevel();
  }, [level]);

  const generateLevel = () => {
    const { grid, targetWords } = generateLetterPathLevel(level);
    setGrid(grid);
    setTargetWords(targetWords);
    setFoundWords([]);
    setSelectedPath([]);
    setIsSelecting(false);
  };

  const isAdjacent = (pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
  };

  const handleCellClick = (row: number, col: number) => {
    const newPos = { row, col };
    
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedPath([newPos]);
    } else {
      const lastPos = selectedPath[selectedPath.length - 1];
      
      if (isAdjacent(lastPos, newPos) && !selectedPath.some(pos => pos.row === row && pos.col === col)) {
        setSelectedPath([...selectedPath, newPos]);
      }
    }
  };

  const getCurrentWord = (): string => {
    return selectedPath.map(pos => grid[pos.row][pos.col]).join('');
  };

  const submitWord = () => {
    const word = getCurrentWord();
    
    if (word.length < 3) {
      toast({
        title: "Word too short",
        description: "Words must be at least 3 letters long.",
        variant: "destructive",
      });
      return;
    }

    if (foundWords.includes(word)) {
      toast({
        title: "Already found",
        description: "You've already found this word.",
        variant: "destructive",
      });
      clearPath();
      return;
    }

    if (isValidWord(word)) {
      const newScore = score + word.length * 10;
      setScore(newScore);
      setFoundWords([...foundWords, word]);
      
      toast({
        title: "Great word! 🎉",
        description: `Found "${word}" for ${word.length * 10} points!`,
      });
      
      // Check if all target words are found
      if ([...foundWords, word].length >= targetWords.length) {
        setLevel(level + 1);
        updateStats({
          currentLevel: level + 1,
          bestLevel: Math.max(stats?.bestLevel || 0, level + 1),
          currentScore: newScore,
          bestScore: Math.max(stats?.bestScore || 0, newScore),
        });
        
        toast({
          title: "Level Complete!",
          description: `Moving to level ${level + 1}!`,
        });
      }
    } else {
      toast({
        title: "Invalid word",
        description: `"${word}" is not a valid word.`,
        variant: "destructive",
      });
    }
    
    clearPath();
  };

  const clearPath = () => {
    setSelectedPath([]);
    setIsSelecting(false);
  };

  const isCellSelected = (row: number, col: number): boolean => {
    return selectedPath.some(pos => pos.row === row && pos.col === col);
  };

  const getCellIndex = (row: number, col: number): number => {
    return selectedPath.findIndex(pos => pos.row === row && pos.col === col);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 to-cyan-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GameHeader
          title="Letter Path"
          onInstructions={() => setShowInstructions(true)}
        />

        <GameStats stats={{
          score,
          level,
        }} />

        {/* Found Words */}
        <Card className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Found Words ({foundWords.length}/{targetWords.length})
              </h3>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Word:</p>
                <p className="text-xl font-bold text-game-info">{getCurrentWord() || "..."}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {foundWords.map((word, index) => (
                <Badge key={index} variant="secondary" className="bg-game-success text-white">
                  {word}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Grid */}
        <Card className="bg-white rounded-2xl p-8 shadow-xl">
          <CardContent className="pt-0">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600">Connect adjacent letters to form words!</p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 4}, 1fr)` }}>
                {grid.map((row, rowIndex) =>
                  row.map((letter, colIndex) => {
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const cellIndex = getCellIndex(rowIndex, colIndex);
                    
                    return (
                      <Button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`w-12 h-12 text-xl font-bold rounded-xl transition-all duration-200 relative ${
                          isSelected
                            ? 'bg-game-info text-white scale-110'
                            : 'bg-white border-2 border-gray-300 text-gray-800 hover:border-game-info hover:scale-105'
                        }`}
                      >
                        {letter}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-game-secondary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {cellIndex + 1}
                          </div>
                        )}
                      </Button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={clearPath}
                variant="outline"
                className="bg-gray-500 text-white hover:bg-gray-600"
                disabled={!isSelecting}
              >
                Clear Path
              </Button>
              <Button
                onClick={submitWord}
                className="bg-game-info text-white hover:bg-blue-600"
                disabled={selectedPath.length < 3}
              >
                Submit Word
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <InstructionsModal
        open={showInstructions}
        onOpenChange={setShowInstructions}
        game="letterpath"
      />
    </div>
  );
}
