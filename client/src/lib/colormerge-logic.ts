interface Color {
  r: number;
  g: number;
  b: number;
}

interface ColorMergeState {
  currentColor: Color;
  targetColor: Color;
  recipe: { [key: string]: number };
  mixCount: number;
  maxMixes: number;
  hearts: number;
  chosenColors: string[];
  colorClicks: { [key: string]: number };
  currentLevel: number;
}

const colorValues: { [key: string]: Color } = {
  red: { r: 255, g: 0, b: 0 },
  yellow: { r: 255, g: 255, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  green: { r: 0, g: 255, b: 0 }
};

export class ColorMergeLogic {
  private state: ColorMergeState;

  constructor(initialLevel: number = 1, initialHearts: number = 3) {
    this.state = {
      currentColor: { r: 255, g: 255, b: 255 },
      targetColor: { r: 255, g: 255, b: 255 },
      recipe: {},
      mixCount: 0,
      maxMixes: initialLevel,
      hearts: initialHearts,
      chosenColors: [],
      colorClicks: { red: 0, yellow: 0, blue: 0, white: 0, black: 0 },
      currentLevel: initialLevel,
    };
    this.generateNewTarget();
    // Reset current color to white after generating target
    this.state.currentColor = { r: 255, g: 255, b: 255 };
  }

  public getState(): ColorMergeState {
    return { ...this.state };
  }

  public generateNewTarget(): void {
    const recipe: { [key: string]: number } = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 };
    let simulatedColor: Color = { r: 255, g: 255, b: 255 };
    const colorsAvailable = ['red', 'yellow', 'blue', 'white', 'black'];
    const chosenColors: string[] = [];
    let colorCount = 0;

    for (let i = 0; i < this.state.maxMixes; i++) {
      const color = colorsAvailable[Math.floor(Math.random() * colorsAvailable.length)];
      chosenColors.push(color);
      recipe[color]++;
    }

    const effectiveColors = this.getEffectiveColors(chosenColors);
    effectiveColors.forEach(color => {
      colorCount++;
      simulatedColor.r = (simulatedColor.r * (colorCount - 1) + colorValues[color].r) / colorCount;
      simulatedColor.g = (simulatedColor.g * (colorCount - 1) + colorValues[color].g) / colorCount;
      simulatedColor.b = (simulatedColor.b * (colorCount - 1) + colorValues[color].b) / colorCount;
    });

    this.state.targetColor = simulatedColor;
    this.state.recipe = recipe;
    this.state.currentColor = { r: 255, g: 255, b: 255 }; // Always start mixing from white
    this.state.mixCount = 0;
    this.state.chosenColors = [];
    this.state.colorClicks = { red: 0, yellow: 0, blue: 0, white: 0, black: 0 }; // Reset clicks
  }

  public addColor(color: string): { success: boolean; gameOver: boolean; levelComplete: boolean; bonusHeart: boolean } {
    if (this.state.mixCount >= this.state.maxMixes || !(color in colorValues)) {
      return { success: false, gameOver: false, levelComplete: false, bonusHeart: false };
    }

    this.state.chosenColors.push(color);
    this.state.colorClicks[color]++;
    this.state.mixCount++;

    this.updateCurrentColor();

    // Check for immediate match (bonus heart scenario)
    if (this.colorsMatch() && this.state.mixCount < this.state.maxMixes) {
      this.state.hearts++;
      return { success: true, gameOver: false, levelComplete: true, bonusHeart: true };
    }

    // Check for final match
    if (this.state.mixCount === this.state.maxMixes) {
      if (this.colorsMatch()) {
        // Don't call nextLevel here - let the UI handle it
        return { success: true, gameOver: false, levelComplete: true, bonusHeart: false };
      } else {
        this.state.hearts--;
        const gameOver = this.state.hearts <= 0;
        if (!gameOver) {
          this.generateNewTarget();
        }
        return { success: false, gameOver, levelComplete: false, bonusHeart: false };
      }
    }

    return { success: true, gameOver: false, levelComplete: false, bonusHeart: false };
  }

  private updateCurrentColor(): void {
    const effectiveColors = this.getEffectiveColors(this.state.chosenColors);
    this.state.currentColor = this.calculateAverageColor(effectiveColors);
  }

  private calculateAverageColor(effectiveColors: string[]): Color {
    const totalColors = effectiveColors.length;
    if (totalColors === 0) return { r: 255, g: 255, b: 255 };

    const r = effectiveColors.reduce((sum, color) => sum + colorValues[color].r, 0) / totalColors;
    const g = effectiveColors.reduce((sum, color) => sum + colorValues[color].g, 0) / totalColors;
    const b = effectiveColors.reduce((sum, color) => sum + colorValues[color].b, 0) / totalColors;

    return { r, g, b };
  }

  private getEffectiveColors(colors: string[]): string[] {
    const colorCounts = colors.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const yellowCount = colorCounts.yellow || 0;
    const blueCount = colorCounts.blue || 0;
    
    // Convert blue + yellow to green
    if (yellowCount > 0 && blueCount > 0) {
      const greenCount = Math.min(yellowCount, blueCount);
      colorCounts.yellow = yellowCount - greenCount;
      colorCounts.blue = blueCount - greenCount;
      colorCounts.green = (colorCounts.green || 0) + greenCount;
    }

    // Convert back to array
    const effectiveColors: string[] = [];
    Object.entries(colorCounts).forEach(([color, count]) => {
      for (let i = 0; i < count; i++) {
        effectiveColors.push(color);
      }
    });

    return effectiveColors;
  }

  private colorsMatch(): boolean {
    return Math.round(this.state.currentColor.r) === Math.round(this.state.targetColor.r) &&
           Math.round(this.state.currentColor.g) === Math.round(this.state.targetColor.g) &&
           Math.round(this.state.currentColor.b) === Math.round(this.state.targetColor.b);
  }

  public nextLevel(): void {
    this.state.currentLevel++;
    this.state.maxMixes++;
    
    // Gain a heart every 10 levels
    if (this.state.currentLevel % 10 === 0) {
      this.state.hearts++;
    }
    
    this.generateNewTarget();
  }

  public resetLevel(): void {
    this.generateNewTarget();
  }

  public resetGame(): void {
    this.state.currentLevel = 1;
    this.state.maxMixes = 1;
    this.state.hearts = 3;
    this.generateNewTarget();
  }

  public getRemainingMixes(): number {
    return this.state.maxMixes - this.state.mixCount;
  }

  public getTargetColorString(): string {
    const { r, g, b } = this.state.targetColor;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  public getCurrentColorString(): string {
    const { r, g, b } = this.state.currentColor;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  public getCurrentTargetColorArray(): string[] {
    // Return the actual recipe used to generate the target
    const targetColors: string[] = [];
    Object.entries(this.state.recipe).forEach(([color, count]) => {
      for (let i = 0; i < count; i++) {
        targetColors.push(color);
      }
    });
    return targetColors;
  }
}
