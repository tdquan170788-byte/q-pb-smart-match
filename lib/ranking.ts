import type { Player, RankingRow } from "@/types";

export function buildRanking(players: Player[]): RankingRow[] {
  return [...players]
    .map((player) => {
      const winRate =
        player.matches > 0 ? Math.round((player.wins / player.matches) * 100) : 0;

      return {
        playerId: player.id,
        name: player.name,
        nickname: player.nickname,
        rating: player.rating,
        wins: player.wins,
        losses: player.losses,
        matches: player.matches,
        winRate,
      };
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name, "vi");
    });
}