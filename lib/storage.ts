import type { MatchRecord, Player, SessionRecord } from "@/types";

const PLAYERS_KEY = "qpb_players";
const MATCHES_KEY = "qpb_matches";
const SESSIONS_KEY = "qpb_sessions";

/* =========================
   SEED DATA
========================= */

const seededPlayers: Player[] = [
  {
    id: "p1",
    name: "Thụy",
    nickname: "Thụy",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    name: "Sơn",
    nickname: "Sơn",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p3",
    name: "Đức",
    nickname: "Đức",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p4",
    name: "Cường",
    nickname: "Cường",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p5",
    name: "Tùng",
    nickname: "Tùng",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p6",
    name: "Quân",
    nickname: "Quân",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p7",
    name: "Kon",
    nickname: "Kon",
    rating: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "p8",
    name: "Vũ",
    nickname: "Vũ",
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

/* tương thích với code cũ */
export function ensureSeedPlayers() {
  ensureSeedData();
}

export function resetSeedPlayers() {
  safeWrite(PLAYERS_KEY, seededPlayers);
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
}): Player {
  const players = getPlayers();

  const newPlayer: Player = {
    id: createId("player"),
    name: payload.name.trim(),
    nickname: payload.nickname?.trim() || "",
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

/* alias cho code cũ của members/page.tsx */
export function createPlayer(payload: {
  name: string;
  nickname?: string;
}) {
  return addPlayer(payload);
}

export function updatePlayer(updated: Player): Player;
export function updatePlayer(
  playerId: string,
  payload: { name: string; nickname?: string }
): Player | null;
export function updatePlayer(
  arg1: Player | string,
  arg2?: { name: string; nickname?: string }
): Player | null {
  const players = getPlayers();

  if (typeof arg1 === "string") {
    const playerId = arg1;
    const payload = arg2;
    if (!payload) return null;

    let updatedPlayer: Player | null = null;

    const next = players.map((p) => {
      if (p.id !== playerId) return p;

      updatedPlayer = {
        ...p,
        name: payload.name.trim(),
        nickname: payload.nickname?.trim() || "",
      };
      return updatedPlayer;
    });

    savePlayers(next);
    return updatedPlayer;
  }

  const updated = arg1;
  const next = players.map((p) => (p.id === updated.id ? updated : p));
  savePlayers(next);
  return updated;
}

export function deletePlayer(playerId: string) {
  const players = getPlayers().filter((p) => p.id !== playerId);
  savePlayers(players);
}

export function getPlayerById(playerId: string) {
  return getPlayers().find((p) => p.id === playerId) ?? null;
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

export function getMatchesBySession(sessionId: string) {
  return getMatches().filter((m) => m.sessionId === sessionId);
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

export function getSessionById(sessionId: string) {
  return getSessions().find((s) => s.id === sessionId) ?? null;
}

/* =========================
   DETAIL / STATS
========================= */

export function getPlayerDetailStats(playerId: string) {
  const player = getPlayerById(playerId);
  if (!player) return null;

  const matches = getMatches().filter(
    (m) =>
      m.teamA.playerIds.includes(playerId) || m.teamB.playerIds.includes(playerId)
  );

  let wins = 0;
  let losses = 0;

  const recentMatches = [...matches]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((match) => {
      const inTeamA = match.teamA.playerIds.includes(playerId);
      const isWin = inTeamA
        ? match.scoreA > match.scoreB
        : match.scoreB > match.scoreA;

      if (isWin) wins += 1;
      else losses += 1;

      return {
        ...match,
        result: isWin ? "W" : "L",
      };
    });

  return {
    player,
    summary: {
      matches: matches.length,
      wins,
      losses,
      winRate:
        matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
    },
    recentMatches,
  };
}