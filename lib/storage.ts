import type { MatchRecord, Player, SessionRecord } from "@/types";

const PLAYERS_KEY = "qpb_players";
const MATCHES_KEY = "qpb_matches";
const SESSIONS_KEY = "qpb_sessions";

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

/**
 * Alias cho app/session/page.tsx cũ đang import seedPlayersIfEmpty
 * -> để không còn lỗi build.
 */
export function seedPlayersIfEmpty() {
  if (!isBrowser()) return;

  const players = safeRead<Player[]>(PLAYERS_KEY, []);
  if (players.length === 0) {
    safeWrite(PLAYERS_KEY, seededPlayers);
  }
}

/**
 * Reset lại danh sách player về seed mẫu.
 */
export function resetSeedPlayers() {
  safeWrite(PLAYERS_KEY, seededPlayers);
}

/* =========================================================
   PLAYERS
========================================================= */

export function getPlayers(): Player[] {
  return safeRead<Player[]>(PLAYERS_KEY, seededPlayers);
}

export function savePlayers(players: Player[]) {
  safeWrite(PLAYERS_KEY, players);
}

export function createPlayer(form: { name: string; nickname?: string }): Player {
  const players = getPlayers();

  const newPlayer: Player = {
    id: createId("player"),
    name: form.name.trim(),
    nickname: form.nickname?.trim() || "",
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

/**
 * Giữ tương thích cho code cũ nếu có nơi nào gọi addPlayer
 */
export function addPlayer(payload: {
  name: string;
  nickname?: string;
}): Player {
  return createPlayer(payload);
}

/**
 * Hỗ trợ cả 2 kiểu gọi:
 * 1) updatePlayer(updatedPlayer)
 * 2) updatePlayer(playerId, form)
 */
export function updatePlayer(playerOrId: Player | string, form?: { name: string; nickname?: string }) {
  const players = getPlayers();

  // Kiểu 1: updatePlayer(updatedPlayer)
  if (typeof playerOrId !== "string") {
    const updatedPlayer = playerOrId;
    const next = players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p));
    savePlayers(next);
    return;
  }

  // Kiểu 2: updatePlayer(playerId, form)
  const playerId = playerOrId;
  const next = players.map((p) => {
    if (p.id !== playerId) return p;

    return {
      ...p,
      name: form?.name?.trim() || p.name,
      nickname:
        form?.nickname !== undefined ? form.nickname.trim() : p.nickname,
    };
  });

  savePlayers(next);
}

export function deletePlayer(playerId: string) {
  const players = getPlayers().filter((p) => p.id !== playerId);
  savePlayers(players);
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

/* =========================================================
   SESSIONS
========================================================= */

export function getSessions(): SessionRecord[] {
  return safeRead<SessionRecord[]>(SESSIONS_KEY, []);
}

export function saveSessions(sessions: SessionRecord[]) {
  safeWrite(SESSIONS_KEY, sessions);
}

export function createSession(payload: {
  date: string;
  pointToWin: number;
  participantIds: string[];
}): SessionRecord {
  const sessions = getSessions();

  const newSession: SessionRecord = {
    id: createId("session"),
    date: payload.date,
    pointToWin: payload.pointToWin,
    participantIds: payload.participantIds,
    createdAt: new Date().toISOString(),
  };

  const next = [newSession, ...sessions];
  saveSessions(next);
  return newSession;
}

/**
 * Giữ tương thích cho code cũ nếu có nơi nào gọi addSession
 */
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

export function deleteSession(sessionId: string) {
  const sessions = getSessions().filter((s) => s.id !== sessionId);
  saveSessions(sessions);

  // Xóa luôn match thuộc session đó để tránh rác dữ liệu
  const matches = getMatches().filter((m) => m.sessionId !== sessionId);
  saveMatches(matches);
}