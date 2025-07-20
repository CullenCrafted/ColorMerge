import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: string;
}

const instructions = {
  colormerge: {
    title: "ColorMerge Instructions",
    content: [
      "Objective: Mix colors to match the target background color.",
      "",
      "How to Play:",
      "• Use the 5 color buttons: Blue, Red, Yellow, White, and Black",
      "• Each button press adds that color to your mix",
      "• The small circles show how many colors you need to use",
      "• Match the target color exactly to advance to the next level",
      "• You start with 3 hearts - lose one for each wrong answer",
      "• Gain a heart every 10 levels completed",
      "• Mix colors in fewer tries than required for bonus hearts!",
      "",
      "Tips: Yellow + Blue = Green, experiment with different combinations!"
    ]
  },
  connectlines: {
    title: "Connect Lines Instructions",
    content: [
      "Objective: Connect scattered dots to reveal hidden words and images.",
      "",
      "How to Play:",
      "• Click and drag between dots to draw lines",
      "• Connect dots in the correct order to spell out words",
      "• Each level gets progressively more challenging",
      "• Use hints when you're stuck (limited per level)",
      "• Complete words faster for bonus points",
      "• Some levels reveal images when lines are connected properly",
      "",
      "Scoring: Base points for completion + time bonus + accuracy bonus"
    ]
  },
  stretchwords: {
    title: "Stretch Words Instructions",
    content: [
      "Objective: Manipulate stretched and distorted text to reveal hidden words.",
      "",
      "How to Play:",
      "• Use the sliders to adjust text properties: stretch, skew, and rotation",
      "• Transform the distorted text until it becomes readable",
      "• Type your answer in the input field",
      "• Work quickly - you're racing against the clock!",
      "• Each level has more complex distortions",
      "• Bonus points for solving quickly and accurately",
      "",
      "Controls: Stretch X/Y change width/height, Skew tilts text, Rotate spins it"
    ]
  },
  wordscramble: {
    title: "Word Scramble Instructions",
    content: [
      "Objective: Unscramble letters to form the correct word.",
      "",
      "How to Play:",
      "• Drag and drop letters to rearrange them",
      "• Or click letters in the correct order",
      "• Use the hint button if you get stuck",
      "• Complete words quickly for bonus points",
      "• Each level has longer or more complex words",
      "• Some levels have multiple possible answers",
      "",
      "Tips: Look for common word patterns and letter combinations!"
    ]
  },
  letterpath: {
    title: "Letter Path Instructions", 
    content: [
      "Objective: Find word paths through a grid of letters.",
      "",
      "How to Play:",
      "• Click and drag to connect adjacent letters",
      "• Form valid words by connecting letters in sequence",
      "• Letters must be adjacent (horizontally, vertically, or diagonally)",
      "• Each letter can only be used once per word",
      "• Longer words give more points",
      "• Find all possible words to complete the level",
      "",
      "Scoring: Points based on word length and rarity"
    ]
  }
};

export default function InstructionsModal({ open, onOpenChange, game }: InstructionsModalProps) {
  const gameInstructions = instructions[game as keyof typeof instructions];
  
  if (!gameInstructions) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {gameInstructions.title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-gray-600 space-y-2">
          {gameInstructions.content.map((line, index) => (
            <p key={index} className={line === "" ? "h-2" : ""}>
              {line}
            </p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
