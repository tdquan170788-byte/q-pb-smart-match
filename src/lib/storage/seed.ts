import type { Player } from "@/types/domain";

function createSeedPlayer(id: string, name: string, nickname: string): Player {
  return {
    id,
    name,
    nickname,
    createdAt: "2026-01-01T00:00:00.000Z",
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