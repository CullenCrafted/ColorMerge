import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { GameStats } from "@shared/schema";

export function useGameStats(gameType: string) {
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats", gameType],
  });

  const updateStatsMutation = useMutation({
    mutationFn: (updateData: Partial<GameStats>) => 
      apiRequest("PUT", `/api/stats/${gameType}`, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats", gameType] });
    },
  });

  const updateStats = (updateData: Partial<GameStats>) => {
    updateStatsMutation.mutate(updateData);
  };

  return {
    stats,
    isLoading,
    updateStats,
    isUpdating: updateStatsMutation.isPending,
  };
}
