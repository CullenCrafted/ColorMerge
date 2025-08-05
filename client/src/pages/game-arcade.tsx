import UnifiedGameController from "@/components/unified-game-controller";

export default function GameArcade() {
  return (
    <UnifiedGameController
      gameType="arcade"
      initialLevel={1}
    />
  );
}