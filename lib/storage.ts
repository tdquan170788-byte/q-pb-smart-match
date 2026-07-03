import type { MatchRecord, Player, PlayerForm, SessionRecord } from "@/types";

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
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* =========================================================
   PLAYERS
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

export function resetSeedPlayers() {
  safeWrite(PLAYERS_KEY, seededPlayers);
}

export function getPlayers(): Player[] {
  return safeRead<Player[]>(PLAYERS_KEY, seededPlayers);
}

export function savePlayers(players: Player[]) {
  safeWrite(PLAYERS_KEY, players);
}

export function createPlayer(form: PlayerForm): Player {
  const players = getPlayers();

  const newPlayer: Player = {
    id: createId("player"),
    name: form.name.trim(),
    nickname: form.nickname.trim(),
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

export function updatePlayer(playerId: string, form: PlayerForm) {
  const players = getPlayers();

  const next = players.map((player) =>
    player.id === playerId
      ? {
          ...player,
          name: form.name.trim(),
          nickname: form.nickname.trim(),
        }
      : player
  );

  savePlayers(next);
}

export function deletePlayer(playerId: string) {
  const players = getPlayers().filter((player) => player.id !== playerId);
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

export function createMatch(match: Omit<MatchRecord, "id">): MatchRecord {
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

export function deleteSession(sessionId: string) {
  const sessions = getSessions().filter((session) => session.id !== sessionId);
  saveSessions(sessions);

  const matches = getMatches().filter((match) => match.sessionId !== sessionId);
  saveMatches(matches);
}