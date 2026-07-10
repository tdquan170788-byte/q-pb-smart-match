import type { Player } from "@/types";

function createSeedPlayer(id: string, name: string, nickname: string): Player {
  return {
    id,
    name,
    nickname,
    createdAt: "2026-01-01T00:00:00.000Z",

    // overall
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,

    // normal
    ratingNormal: 1000,
    winsNormal: 0,
    lossesNormal: 0,
    matchesNormal: 0,
    pointsForNormal: 0,
    pointsAgainstNormal: 0,

    // team
    ratingTeam: 1000,
    winsTeam: 0,
    lossesTeam: 0,
    matchesTeam: 0,
    pointsForTeam: 0,
    pointsAgainstTeam: 0,
  };
}

export const seededPlayers: Player[] = [
  createSeedPlayer("p1", "Thụy", "T"),
  createSeedPlayer("p2", "Sơn", "S"),
  createSeedPlayer("p3", "Đức", "D"),
  createSeedPlayer("p4", "Cường", "C"),
  createSeedPlayer("p5", "Tùng", "Tùng"),
  createSeedPlayer("p6", "Quân", "Q"),
  createSeedPlayer("p7", "Kon", "K"),
  createSeedPlayer("p8", "Vũ", "V"),
];
