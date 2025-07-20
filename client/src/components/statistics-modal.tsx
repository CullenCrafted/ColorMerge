import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface StatisticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockStats = {
  colormerge: {
    bestLevel: 25,
    totalPlays: 147,
    successRate: "78%"
  },
  connectlines: {
    bestScore: 1250,
    wordsFound: 89,
    avgTime: "2:34"
  },
  stretchwords: {
    bestScore: 2150,
    accuracy: "85%",
    fastestSolve: "0:12"
  },
  wordscramble: {
    bestScore: 3200,
    wordsUnscrambled: 156,
    avgTime: "1:45"
  },
  letterpath: {
    bestScore: 4450,
    wordsFound: 203,
    longestWord: "BEAUTIFUL"
  }
};

export default function StatisticsModal({ open, onOpenChange }: StatisticsModalProps) {
  const games = [
    { id: 'colormerge', name: 'ColorMerge' },
    { id: 'connectlines', name: 'Connect Lines' },
    { id: 'stretchwords', name: 'Stretch Words' },
    { id: 'wordscramble', name: 'Word Scramble' },
    { id: 'letterpath', name: 'Letter Path' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-96 overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Your Statistics
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const stats = mockStats[game.id as keyof typeof mockStats];
            return (
              <Card key={game.id} className="bg-gray-50">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">{game.name}</h4>
                  <div className="space-y-2">
                    {Object.entries(stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
