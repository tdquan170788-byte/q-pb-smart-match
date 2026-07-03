import type { MatchRecord, Player, SessionRecord } from "@/types";

const PLAYERS_KEY = "qpb_players";
const MATCHES_KEY = "qpb_matches";
const SESSIONS_KEY = "qpb_sessions";

const seededPlayers: Player[] = [
  {
    id: "p1",
    name: "Thụy",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: "A",
    active: true,
  },
  {
    id: "p2",
    name: "Sơn",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: "A",
    active: true,
  },
  {
    id: "p3",
    name: "Đức",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: "A",
    active: true,
  },
  {
    id: "p4",
    name: "Cường",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: "A",
    active: true,
  },
  {
    id: "p5",
    name: "Tùng",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: "B",
    active: true,
  },
  {
    id: "p6",
    name: "Quân",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: "B",
    active: true,
  },
  {
    id: "p7",
    name: "Kon",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: "B",
    active: true,
  },
  {
    id: "p8",
    name: "Vũ",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: "B",
    active: true,
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

function safeRead<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Seed dữ liệu mặc định nếu app chưa có dữ liệu */
export function ensureSeedData() {
  if (!isBrowser()) return;

  const players = safeRead<Player[]>(PLAYERS_KEY, []);
  if (players.length === 0) {
    safeWrite(PLAYERS_KEY, seededPlayers);
  }

  const matches = safeRead<MatchRecord[]>(MATCHES_KEY, []);
  if (matches.length === 0) {
    safeWrite(MATCHES_KEY, []);
  }

  const sessions = safeRead<SessionRecord[]>(SESSIONS_KEY, []);
  if (sessions.length === 0) {
    safeWrite(SESSIONS_KEY, []);
  }
}

/* =========================
   PLAYERS
========================= */

export function getPlayers(): Player[] {
  return safeRead<Player[]>(PLAYERS_KEY, seededPlayers);
}

export function savePlayers(players: Player[]) {
  safeWrite(PLAYERS_KEY, players);
}

export function addPlayer(payload: {
  name: string;
  nickname?: string;
  rating?: number;
  team?: "A" | "B";
  active?: boolean;
}): Player {
  const players = getPlayers();

  const newPlayer: Player = {
    id: createId("player"),
    name: payload.name.trim(),
    nickname: payload.nickname ?? "",
    rating: payload.rating ?? 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    team: payload.team ?? "A",
    active: payload.active ?? true,
  };

  const next = [...players, newPlayer];
  savePlayers(next);
  return newPlayer;
}

export function updatePlayer(updated: Player) {
  const players = getPlayers();
  const next = players.map((p) => (p.id === updated.id ? updated : p));
  savePlayers(next);
}

export function deletePlayer(playerId: string) {
  const players = getPlayers().filter((p) => p.id !== playerId);
  savePlayers(players);
}

export function resetPlayersToSeed() {
  savePlayers(seededPlayers);
}

/* =========================
   MATCHES
========================= */

export function getMatches(): MatchRecord[] {
  return safeRead<MatchRecord[]>(MATCHES_KEY, []);
}

export function saveMatches(matches: MatchRecord[]) {
  safeWrite(MATCHES_KEY, matches);
}

export function addMatch(match: Omit<MatchRecord, "id">): MatchRecord {
  const matches = getMatches();
  const newMatch: MatchRecord = {
    ...match,
    id: createId("match"),
  };
  const next = [newMatch, ...matches];
  saveMatches(next);
  return newMatch;
}

/* =========================
   SESSIONS
========================= */

export function getSessions(): SessionRecord[] {
  return safeRead<SessionRecord[]>(SESSIONS_KEY, []);
}

export function saveSessions(sessions: SessionRecord[]) {
  safeWrite(SESSIONS_KEY, sessions);
}

export function addSession(session: Omit<SessionRecord, "id">): SessionRecord {
  const sessions = getSessions();
  const newSession: SessionRecord = {
    ...session,
    id: createId("session"),
  };
  const next = [newSession, ...sessions];
  saveSessions(next);
  return newSession;
}