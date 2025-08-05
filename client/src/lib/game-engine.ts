// Game Engine for ColorMerge Multi-Mode System
// Handles game mode selection, difficulty scaling, and level progression

export interface GameSettings {
  level: number;
  game_mode: GameMode;
  GDI: number;
  settings: any;
}

export type GameMode = 
  | "Classic" 
  | "GolfBall" 
  | "Strings" 
  | "Concentric" 
  | "FlashBG" 
  | "Tetris" 
  | "Chaotic" 
  | "ZenFade";

export class GameEngine {
  private static gameModes: GameMode[] = [
    "Classic",
    "GolfBall", 
    "Strings",
    "Concentric",
    "FlashBG",
    "Tetris",
    "Chaotic",
    "ZenFade"
  ];

  static generateLevel(levelNumber: number): GameSettings {
    const currentGame = this.gameModes[levelNumber % this.gameModes.length];
    const GDI = levelNumber * 1.15;

    return {
      level: levelNumber,
      game_mode: currentGame,
      GDI,
      settings: this.generateSettings(currentGame, GDI)
    };
  }

  private static generateSettings(gameMode: GameMode, GDI: number): any {
    const baseGDI = Math.max(1, GDI);
    
    switch (gameMode) {
      case "Classic":
        return {
          colors: Math.min(5, Math.floor(2 + GDI / 8)),
          complexity: Math.min(0.8, 0.1 + GDI / 50),
          timeLimit: Math.max(30, 120 - GDI * 2)
        };

      case "GolfBall":
        return {
          dimples: Math.min(100, Math.floor(8 + GDI * 1.5)),
          background_colors: Math.min(6, Math.floor(2 + GDI / 10)),
          blend_variance: Math.min(0.3, 0.05 + GDI / 100),
          rotation_speed: Math.min(3, 0.5 + GDI / 20)
        };

      case "Strings":
        return {
          bands: Math.min(12, Math.floor(2 + GDI / 8)),
          width_variance: Math.min(0.8, 0.2 + GDI / 50),
          curvature: Math.min(2, 0.1 + GDI / 25),
          overlap_complexity: Math.min(0.9, 0.1 + GDI / 40)
        };

      case "Concentric":
        return {
          rings: Math.min(8, Math.floor(2 + GDI / 12)),
          color_transitions: Math.min(0.9, 0.1 + GDI / 30),
          blend_precision: Math.max(0.1, 0.8 - GDI / 40),
          animation_speed: Math.min(2, 0.3 + GDI / 30)
        };

      case "FlashBG":
        return {
          flash_duration: Math.max(0.5, 3 - GDI / 10),
          color_complexity: Math.min(6, Math.floor(2 + GDI / 8)),
          pattern_complexity: Math.min(0.9, 0.1 + GDI / 25),
          fade_time: Math.max(1, 5 - GDI / 15)
        };

      case "Tetris":
        return {
          fall_speed: Math.min(5, 0.5 + GDI / 15),
          shapes_per_wave: Math.min(6, Math.floor(1 + GDI / 10)),
          color_complexity: Math.min(5, Math.floor(2 + GDI / 12)),
          shape_variety: Math.min(6, Math.floor(3 + GDI / 20))
        };

      case "Chaotic":
        return {
          spawn_rate: Math.min(8, 1 + GDI / 8),
          bounce_speed: Math.min(4, 0.5 + GDI / 20),
          max_shapes: Math.min(15, Math.floor(3 + GDI / 6)),
          color_complexity: Math.min(5, Math.floor(2 + GDI / 10))
        };

      case "ZenFade":
        return {
          fade_duration: Math.max(3, 15 - GDI / 5),
          color_steps: Math.min(8, Math.floor(2 + GDI / 15)),
          precision_required: Math.max(0.05, 0.3 - GDI / 100),
          transition_smoothness: Math.min(0.9, 0.1 + GDI / 40)
        };

      default:
        return {};
    }
  }

  static getGameModeDisplayName(mode: GameMode): string {
    const names = {
      Classic: "Classic ColorMerge",
      GolfBall: "Golf Ball Dimples",
      Strings: "Color Bands",
      Concentric: "Concentric Circles", 
      FlashBG: "Flash Memory",
      Tetris: "Falling Shapes",
      Chaotic: "Chaotic Bounce",
      ZenFade: "Zen Fade"
    };
    return names[mode];
  }

  static getGameModeDescription(mode: GameMode): string {
    const descriptions = {
      Classic: "Mix colors to match the target background - the original ColorMerge experience",
      GolfBall: "Tap dimples on a rotating sphere and blend colors to match the background",
      Strings: "Color bands overlay the background - tap and blend to make them disappear",
      Concentric: "Nested circles build upon each other - match each ring from inside out",
      FlashBG: "The background flashes briefly - recreate it from memory by blending colors",
      Tetris: "Complete color blends on falling shapes before they hit the bottom",
      Chaotic: "Bouncing shapes fill the screen - match background colors before overcrowding",
      ZenFade: "Follow the slow fade transitions - match colors as the background changes"
    };
    return descriptions[mode];
  }

  static getAllGameModes(): GameMode[] {
    return [...this.gameModes];
  }
}