import { MatchRecord, Player, SessionRecord } from "@/types";

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
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Sơn",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p3",
    name: "Đức",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p4",
    name: "Cường",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p5",
    name: "Tùng",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p6",
    name: "Quân",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p7",
    name: "Kon",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p8",
    name: "Vũ",
    nickname: "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
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

/* =========================================================
   SEED
========================================================= */

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

export function ensureSeedPlayers() {
  if (!isBrowser()) return;
  const players = safeRead<Player[]>(PLAYERS_KEY, []);
  if (players.length === 0) {
    safeWrite(PLAYERS_KEY, seededPlayers);
  }
}

export function resetSeedPlayers() {
  safeWrite(PLAYERS_KEY, seededPlayers);
}

/* =========================================================
   PLAYERS
========================================================= */

export function getPlayers(): Player[] {
  return safeRead<Player[]>(PLAYERS_KEY, seededPlayers);
}

export function getPlayerById(playerId: string): Player | undefined {
  return getPlayers().find((p) => p.id === playerId);
}

export function savePlayers(players: Player[]) {
  safeWrite(PLAYERS_KEY, players);
}

export function addPlayer(payload: {
  name: string;
  nickname?: string;
}): Player {
  const players = getPlayers();

  const newPlayer: Player = {
    id: createId("player"),
    name: payload.name.trim(),
    nickname: payload.nickname?.trim() ?? "",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  };

  const next = [...players, newPlayer];
  savePlayers(next);
  return newPlayer;
}

export function createPlayer(payload: {
  name: string;
  nickname?: string;
}): Player {
  return addPlayer(payload);
}

export function updatePlayer(updated: Player): void;
export function updatePlayer(
  playerId: string,
  payload: { name: string; nickname?: string }
): void;
export function updatePlayer(
  arg1: Player | string,
  arg2?: { name: string; nickname?: string }
) {
  const players = getPlayers();

  if (typeof arg1 === "string") {
    const playerId = arg1;
    const payload = arg2;
    if (!payload) return;

    const next = players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            name: payload.name.trim(),
            nickname: payload.nickname?.trim() ?? "",
          }
        : p
    );

    savePlayers(next);
    return;
  }

  const updated = arg1;
  const next = players.map((p) => (p.id === updated.id ? updated : p));
  savePlayers(next);
}

export function deletePlayer(playerId: string) {
  const players = getPlayers().filter((p) => p.id !== playerId);
  savePlayers(players);
}

/* =========================================================
   SESSIONS
========================================================= */

export function getSessions(): SessionRecord[] {
  return safeRead<SessionRecord[]>(SESSIONS_KEY, []);
}

export function getSessionById(sessionId: string): SessionRecord | undefined {
  return getSessions().find((s) => s.id === sessionId);
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

export function createSession(payload: {
  date: string;
  pointToWin: number;
  participantIds: string[];
}): SessionRecord {
  return addSession({
    date: payload.date,
    pointToWin: payload.pointToWin,
    participantIds: payload.participantIds,
    createdAt: new Date().toISOString(),
  });
}

export function deleteSession(sessionId: string) {
  const sessions = getSessions().filter((s) => s.id !== sessionId);
  saveSessions(sessions);

  const matches = getMatches().filter((m) => m.sessionId !== sessionId);
  saveMatches(matches);
}

/* =========================================================
   MATCHES
========================================================= */

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

export function getMatchesBySessionId(sessionId: string): MatchRecord[] {
  return getMatches()
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => a.round - b.round);
}

/**
 * Alias để tương thích với các file cũ đang import tên này
 */
export function getMatchesBySession(sessionId: string): MatchRecord[] {
  return getMatchesBySessionId(sessionId);
}