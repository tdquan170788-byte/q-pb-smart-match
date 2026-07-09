import type { Player } from "@/types/domain";
import { safeRead, safeWrite } from "./local";
import { createId } from "@/lib/shared/ids";

const PLAYERS_KEY = "qpb_players";

function withPlayerDefaults(player: Partial<Player> & Pick<Player, "id" | "name">): Player {
  return {
    id: player.id,
    name: player.name,
    nickname: player.nickname ?? "",
    createdAt: player.createdAt ?? new Date().toISOString(),
  };
}

export const playersRepo = {
  getAll(): Player[] {
    const players = safeRead<Player[]>(PLAYERS_KEY, []);
    return players.map((p) => withPlayerDefaults(p));
  },

  saveAll(players: Player[]) {
    safeWrite(PLAYERS_KEY, players.map((p) => withPlayerDefaults(p)));
  },

  create(payload: { name: string; nickname?: string }): Player {
    const players = this.getAll();

    const newPlayer: Player = withPlayerDefaults({
      id: createId("player"),
      name: payload.name.trim(),
      nickname: payload.nickname?.trim() || "",
      createdAt: new Date().toISOString(),
    });

    this.saveAll([newPlayer, ...players]);
    return newPlayer;
  },

  update(playerIdOrPlayer: string | Player, payload?: { name?: string; nickname?: string }) {
    const players = this.getAll();

    if (typeof playerIdOrPlayer !== "string") {
      const updatedPlayer = withPlayerDefaults(playerIdOrPlayer);
      this.saveAll(players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)));
      return;
    }

    const playerId = playerIdOrPlayer;
    const next = players.map((p) => {
      if (p.id !== playerId) return p;

      return withPlayerDefaults({
        ...p,
        name: payload?.name?.trim() ?? p.name,
        nickname: payload?.nickname?.trim() ?? p.nickname ?? "",
      });
    });

    this.saveAll(next);
  },

  delete(playerId: string) {
    this.saveAll(this.getAll().filter((p) => p.id !== playerId));
  },
};