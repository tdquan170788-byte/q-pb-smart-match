import type { MatchRecord, Player, PlayerForm, SessionRecord } from "@/types";

/* =========================================================
   STORAGE KEYS
========================================================= */

const PLAYERS_KEY = "qpb_players";
const MATCHES_KEY = "qpb_matches";
const SESSIONS_KEY = "qpb_sessions";

/* =========================================================
   SEEDED PLAYERS
========================================================= */

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

/* =========================================================
   BASIC HELPERS
========================================================= */

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
   SEED / RESET
========================================================= */

export function ensureSeedPlayers() {
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

/** Alias cũ để tương thích các file trước đó nếu còn import ensureSeedData */
export function ensureSeedData() {
  ensureSeedPlayers();
}

export function resetSeedPlayers() {
  if (!isBrowser()) return;
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

/**
 * Dùng cho app/members/page.tsx hiện tại
 */
export function createPlayer(form: PlayerForm): Player {
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

  const next = [newPlayer, ...players];
  savePlayers(next);
  return newPlayer;
}

/**
 * Alias để tương thích code cũ nếu chỗ nào còn dùng addPlayer
 */
export function addPlayer(payload: {
  name: string;
  nickname?: string;
}): Player {
  return createPlayer({
    name: payload.name,
    nickname: payload.nickname ?? "",
  });
}

/**
 * Hỗ trợ cả 2 kiểu gọi:
 * updatePlayer(updatedPlayerObject)
 * updatePlayer(playerId, form)
 */
export function updatePlayer(playerOrId: Player | string, form?: PlayerForm) {
  const players = getPlayers();

  if (typeof playerOrId === "string") {
    const playerId = playerOrId;
    if (!form) return;

    const next = players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            name: form.name.trim(),
            nickname: form.nickname?.trim() || "",
          }
        : p
    );

    savePlayers(next);
    return;
  }

  const updatedPlayer = playerOrId;
  const next = players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p));
  savePlayers(next);
}

export function deletePlayer(playerId: string) {
  const players = getPlayers().filter((p) => p.id !== playerId);
  savePlayers(players);
}

export function getPlayerById(playerId: string): Player | undefined {
  return getPlayers().find((p) => p.id === playerId);
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

export function createMatch(match: Omit<MatchRecord, "id">): MatchRecord {
  return addMatch(match);
}

export function updateMatch(updatedMatch: MatchRecord) {
  const matches = getMatches();
  const next = matches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
  saveMatches(next);
}

export function deleteMatch(matchId: string) {
  const matches = getMatches().filter((m) => m.id !== matchId);
  saveMatches(matches);
}

export function getMatchById(matchId: string): MatchRecord | undefined {
  return getMatches().find((m) => m.id === matchId);
}

export function getMatchesBySession(sessionId: string): MatchRecord[] {
  return getMatches()
    .filter((match) => match.sessionId === sessionId)
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.createdAt.localeCompare(b.createdAt);
    });
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

export function updateSession(updatedSession: SessionRecord) {
  const sessions = getSessions();
  const next = sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
  saveSessions(next);
}

export function deleteSession(sessionId: string) {
  const sessions = getSessions().filter((s) => s.id !== sessionId);
  saveSessions(sessions);

  // Xoá luôn các trận thuộc buổi chơi này để tránh dữ liệu mồ côi
  const matches = getMatches().filter((m) => m.sessionId !== sessionId);
  saveMatches(matches);
}

export function getSessionById(sessionId: string): SessionRecord | undefined {
  return getSessions().find((s) => s.id === sessionId);
}