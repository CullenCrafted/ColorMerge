import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameHeader from "@/components/game-header";
import GameStats from "@/components/game-stats";
import InstructionsModal from "@/components/instructions-modal";
import { generateConnectLinesLevel, calculateScore } from "@/lib/game-utils";
import { useGameStats } from "@/hooks/use-game-stats";
import { useToast } from "@/hooks/use-toast";

interface Dot {
  id: number;
  letter: string;
  x: number;
  y: number;
}

interface Line {
  from: number;
  to: number;
}

export default function ConnectLines() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(3);
  const [targetWord, setTargetWord] = useState("");
  const [dots, setDots] = useState<Dot[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<{ from: number; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { stats, updateStats } = useGameStats("connectlines");
  const { toast } = useToast();

  useEffect(() => {
    generateLevel();
  }, [level]);

  useEffect(() => {
    drawCanvas();
  }, [lines, currentLine, dots]);

  const generateLevel = () => {
    const { targetWord, dots } = generateConnectLinesLevel(level);
    setTargetWord(targetWord);
    setDots(dots);
    setLines([]);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing lines
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    lines.forEach(line => {
      const fromDot = dots.find(d => d.id === line.from);
      const toDot = dots.find(d => d.id === line.to);
      if (fromDot && toDot) {
        ctx.beginPath();
        ctx.moveTo(fromDot.x, fromDot.y);
        ctx.lineTo(toDot.x, toDot.y);
        ctx.stroke();
      }
    });

    // Draw current line being drawn
    if (currentLine) {
      const fromDot = dots.find(d => d.id === currentLine.from);
      if (fromDot) {
        ctx.strokeStyle = '#93C5FD';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(fromDot.x, fromDot.y);
        ctx.lineTo(currentLine.x, currentLine.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  const handleDotClick = (dotId: number) => {
    if (isDrawing && currentLine && currentLine.from !== dotId) {
      // Complete the line
      const newLine = { from: currentLine.from, to: dotId };
      setLines([...lines, newLine]);
      setCurrentLine(null);
      setIsDrawing(false);
    } else if (!isDrawing) {
      // Start drawing from this dot
      setIsDrawing(true);
      const dot = dots.find(d => d.id === dotId);
      if (dot) {
        setCurrentLine({ from: dotId, x: dot.x, y: dot.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && currentLine) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setCurrentLine({
          ...currentLine,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const checkAnswer = () => {
    // Simple check: see if lines connect dots in correct order
    const connectedLetters = lines
      .sort((a, b) => a.from - a.to)
      .map(line => {
        const fromDot = dots.find(d => d.id === line.from);
        const toDot = dots.find(d => d.id === line.to);
        return fromDot?.letter + toDot?.letter;
      })
      .join('');

    const formedWord = dots
      .sort((a, b) => a.id - b.id)
      .map(dot => dot.letter)
      .join('');

    if (formedWord === targetWord) {
      const newScore = score + calculateScore("connectlines", level, 30, 100);
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
        description: `You found ${targetWord}! Moving to level ${level + 1}`,
      });
    } else {
      toast({
        title: "Not quite right",
        description: "Try connecting the dots in a different order.",
        variant: "destructive",
      });
    }
  };

  const useHint = () => {
    if (hints > 0) {
      setHints(hints - 1);
      toast({
        title: "Hint",
        description: `The word is ${targetWord.charAt(0)}****`,
      });
    }
  };

  const clearLines = () => {
    setLines([]);
    setCurrentLine(null);
    setIsDrawing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-teal-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GameHeader
          title="Connect Lines"
          onInstructions={() => setShowInstructions(true)}
        />

        <GameStats stats={{
          score,
          level,
          hints,
          targetWord,
        }} />

        {/* Game Area */}
        <Card className="bg-white rounded-2xl p-8 shadow-xl">
          <CardContent className="pt-0">
            <div className="text-center mb-6">
              <p className="text-lg text-gray-600">Connect the dots to reveal the word!</p>
            </div>

            {/* Canvas Area */}
            <div className="relative bg-gray-50 rounded-xl p-8 mb-6" style={{ height: "400px" }}>
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="absolute inset-0 w-full h-full canvas-drawing"
                onMouseMove={handleMouseMove}
                onClick={() => {
                  if (isDrawing) {
                    setIsDrawing(false);
                    setCurrentLine(null);
                  }
                }}
              />
              
              {dots.map((dot) => (
                <div
                  key={dot.id}
                  className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    left: `${dot.x}px`,
                    top: `${dot.y}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => handleDotClick(dot.id)}
                >
                  {dot.letter}
                </div>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={useHint}
                disabled={hints <= 0}
                className="bg-game-success text-white hover:bg-green-600"
              >
                Use Hint ({hints})
              </Button>
              <Button
                onClick={clearLines}
                variant="outline"
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                Clear Lines
              </Button>
              <Button
                onClick={checkAnswer}
                className="bg-game-primary text-white hover:bg-indigo-600"
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
        game="connectlines"
      />
    </div>
  );
}
