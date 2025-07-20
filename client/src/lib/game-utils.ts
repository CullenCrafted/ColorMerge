export function generateConnectLinesLevel(level: number) {
  const words = ['HOUSE', 'LIGHT', 'WORLD', 'PEACE', 'HEART', 'DREAM', 'MAGIC', 'POWER'];
  const targetWord = words[Math.min(level - 1, words.length - 1)] || 'WORD';
  
  const dots = targetWord.split('').map((letter, index) => ({
    id: index + 1,
    letter,
    x: Math.random() * 300 + 50,
    y: Math.random() * 300 + 50,
  }));

  return { targetWord, dots };
}

export function generateStretchWordsLevel(level: number) {
  const words = ['PUZZLE', 'CHALLENGE', 'VICTORY', 'WISDOM', 'COURAGE', 'JOURNEY', 'TRIUMPH', 'MYSTERY'];
  const word = words[Math.min(level - 1, words.length - 1)] || 'WORD';
  
  const distortions = {
    scaleX: 1.5 + Math.random() * 2,
    scaleY: 0.8 + Math.random() * 0.4,
    skewX: -30 + Math.random() * 60,
    rotate: -20 + Math.random() * 40,
  };

  return { word, distortions };
}

export function generateWordScrambleLevel(level: number) {
  const words = ['PLAY', 'GAME', 'SCORE', 'LEVEL', 'POWER', 'MAGIC', 'QUEST', 'GLORY'];
  const word = words[Math.min(level - 1, words.length - 1)] || 'WORD';
  
  const letters = word.split('');
  const scrambled = [...letters].sort(() => Math.random() - 0.5);
  
  return { word, scrambled };
}

export function generateLetterPathLevel(level: number) {
  const gridSize = Math.min(4 + Math.floor(level / 3), 8);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  const grid = Array(gridSize).fill(null).map(() =>
    Array(gridSize).fill(null).map(() =>
      letters[Math.floor(Math.random() * letters.length)]
    )
  );

  // Add some common words
  const words = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR'];
  const targetWords = words.slice(0, Math.min(3 + Math.floor(level / 2), 10));

  return { grid, targetWords };
}

export function calculateScore(gameType: string, level: number, timeUsed: number, accuracy: number = 100) {
  const baseScore = level * 100;
  const timeBonus = Math.max(0, 60 - timeUsed) * 10;
  const accuracyBonus = accuracy * 2;
  
  return Math.round(baseScore + timeBonus + accuracyBonus);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function isValidWord(word: string): boolean {
  // Simple word validation - in a real app, you'd use a dictionary API
  const commonWords = [
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR',
    'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO',
    'WHO', 'BOY', 'DID', 'SAY', 'SHE', 'USE', 'EACH', 'MAKE', 'MOST', 'OVER', 'SAID', 'SOME',
    'TIME', 'VERY', 'WHAT', 'WITH', 'HAVE', 'FROM', 'THEY', 'KNOW', 'WANT', 'BEEN', 'GOOD',
    'MUCH', 'COME', 'COULD', 'HOUSE', 'LIGHT', 'WORLD', 'PEACE', 'HEART', 'DREAM', 'MAGIC',
    'POWER', 'PUZZLE', 'CHALLENGE', 'VICTORY', 'WISDOM', 'COURAGE', 'JOURNEY', 'TRIUMPH', 'MYSTERY'
  ];
  
  return commonWords.includes(word.toUpperCase());
}
