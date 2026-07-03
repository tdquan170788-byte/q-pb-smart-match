import type { Player, MatchRecord, SessionRecord, PlayerForm } from "@/types";

const PLAYERS_KEY = "qpb_players";
const SESSIONS_KEY = "qpb_sessions";
const MATCHES_KEY = "qpb_matches";

const seedPlayers: Player[] = [
  {
    id: crypto.randomUUID(),
    name: "Thụy",
    nickname: "Thụy",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sơn",
    nickname: "Sơn",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Đức",
    nickname: "Đức",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Cường",
    nickname: "Cường",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Tùng",
    nickname: "Tùng",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Quân",
    nickname: "Quân",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Kon",
    nickname: "Kon",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Vũ",
    nickname: "Vũ",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
];

function hasWindow() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasWindow()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getPlayers(): Player[] {
  const players = readJson<Player[]>(PLAYERS_KEY, []);
  return players;
}

export function savePlayers(players: Player[]) {
  writeJson(PLAYERS_KEY, players);
}

export function ensureSeedPlayers() {
  const current = getPlayers();
  if (current.length === 0) {
    savePlayers(seedPlayers);
  }
}

export function resetSeedPlayers() {
  savePlayers(
    seedPlayers.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }))
  );
}

export function createPlayer(input: PlayerForm): Player {
  const player: Player = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    nickname: input.nickname.trim(),
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  };

  const players = getPlayers();
  const next = [player, ...players];
  savePlayers(next);
  return player;
}

export function updatePlayer(playerId: string, input: PlayerForm) {
  const players = getPlayers();
  const next = players.map((player) =>
    player.id === playerId
      ? {
          ...player,
          name: input.name.trim(),
          nickname: input.nickname.trim(),
        }
      : player
  );
  savePlayers(next);
}

export function deletePlayer(playerId: string) {
  const players = getPlayers();
  const next = players.filter((player) => player.id !== playerId);
  savePlayers(next);
}

export function getSessions(): SessionRecord[] {
  return readJson<SessionRecord[]>(SESSIONS_KEY, []);
}

export function saveSessions(sessions: SessionRecord[]) {
  writeJson(SESSIONS_KEY, sessions);
}

export function getMatches(): MatchRecord[] {
  return readJson<MatchRecord[]>(MATCHES_KEY, []);
}

export function saveMatches(matches: MatchRecord[]) {
  writeJson(MATCHES_KEY, matches);
}